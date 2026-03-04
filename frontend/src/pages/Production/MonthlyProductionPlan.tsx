import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import SearchableSelect from '../../components/SearchableSelect';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  PencilIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  CubeIcon,
  XMarkIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface MonthlySchedule {
  id: number;
  year: number;
  month: number;
  month_name: string;
  product_id: number;
  product_code: string;
  product_name: string;
  machine_id: number | null;
  machine_code: string | null;
  machine_name: string | null;
  target_ctn: number;
  target_pack: number;
  qty_per_ctn: number;
  scheduled_ctn: number;
  remaining_ctn: number;
  progress_percent: number;
  priority: string;
  spek_kain: string;
  color: string;
  notes: string;
  status: string;
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
  packs_per_karton?: number;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SCHEDULE_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-400',
  'bg-pink-400', 'bg-teal-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-rose-500',
];

const PRIORITIES = [
  { value: 'low', label: 'Rendah', color: 'bg-gray-100 text-gray-700' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'Tinggi', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

const MonthlyProductionPlan: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<MonthlySchedule[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Month/Year navigation
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MonthlySchedule | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    machine_id: '',
    target_ctn: '',
    priority: 'normal',
    spek_kain: '',
    color: SCHEDULE_COLORS[0],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [currentYear, currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch machines and products first (independent)
      const [machinesRes, productsRes] = await Promise.all([
        axiosInstance.get('/api/production/machines'),
        axiosInstance.get('/api/products-new/?per_page=1000'),
      ]);
      
      setMachines(machinesRes.data.machines || []);
      const mappedProducts = (productsRes.data.products || []).map((p: any) => ({
        id: p.id,
        code: p.kode_produk || p.code,
        name: p.nama_produk || p.name,
        packs_per_karton: p.pack_per_karton || p.isi_karton,
      }));
      setProducts(mappedProducts);
      
      // Fetch schedules separately to avoid blocking products loading
      try {
        const schedulesRes = await axiosInstance.get(`/api/production/monthly-schedule?year=${currentYear}&month=${currentMonth}`);
        setSchedules(schedulesRes.data.schedules || []);
      } catch (scheduleError) {
        console.error('Error fetching schedules:', scheduleError);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleAddItem = async () => {
    try {
      if (!formData.product_id) {
        alert('Pilih produk');
        return;
      }
      
      // Find selected product to confirm
      const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
      console.log('Saving product:', { 
        product_id: formData.product_id, 
        parsed_id: parseInt(formData.product_id),
        selectedProduct 
      });
      
      await axiosInstance.post('/api/production/monthly-schedule', {
        year: currentYear,
        month: currentMonth,
        product_id: parseInt(formData.product_id),
        machine_id: formData.machine_id ? parseInt(formData.machine_id) : null,
        target_ctn: parseFloat(formData.target_ctn) || 0,
        priority: formData.priority,
        spek_kain: formData.spek_kain,
        color: formData.color,
        notes: formData.notes,
      });
      
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menambah jadwal');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      await axiosInstance.put(`/api/production/monthly-schedule/${editingItem.id}`, {
        machine_id: formData.machine_id ? parseInt(formData.machine_id) : null,
        target_ctn: parseFloat(formData.target_ctn) || 0,
        priority: formData.priority,
        spek_kain: formData.spek_kain,
        color: formData.color,
        notes: formData.notes,
      });
      
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengupdate jadwal');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Hapus jadwal bulanan ini?')) return;
    try {
      await axiosInstance.delete(`/api/production/monthly-schedule/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus');
    }
  };

  const handleEditItem = (item: MonthlySchedule) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id.toString(),
      machine_id: item.machine_id?.toString() || '',
      target_ctn: item.target_ctn.toString(),
      priority: item.priority,
      spek_kain: item.spek_kain || '',
      color: item.color || SCHEDULE_COLORS[0],
      notes: item.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      product_id: '',
      machine_id: '',
      target_ctn: '',
      priority: 'normal',
      spek_kain: '',
      color: SCHEDULE_COLORS[schedules.length % SCHEDULE_COLORS.length],
      notes: '',
    });
  };

  const handleSubmitForApproval = async () => {
    if (!confirm(`Submit rencana produksi ${MONTHS[currentMonth - 1]} ${currentYear} untuk approval?`)) return;
    
    try {
      await axiosInstance.post(`/api/production/monthly-schedule/submit-approval`, {
        year: currentYear,
        month: currentMonth,
      });
      alert('Rencana produksi berhasil disubmit untuk approval!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal submit untuk approval');
    }
  };

  const handlePrintPDF = () => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    // Open print page in new tab
    const printUrl = `/api/production/monthly-schedule/print?year=${currentYear}&month=${currentMonth}&token=${token}`;
    window.open(printUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return { bg: 'bg-yellow-100 text-yellow-700', label: 'Menunggu Approval' };
      case 'approved':
        return { bg: 'bg-green-100 text-green-700', label: 'Approved' };
      case 'in_progress':
        return { bg: 'bg-blue-100 text-blue-700', label: 'In Progress' };
      case 'completed':
        return { bg: 'bg-emerald-100 text-emerald-700', label: 'Selesai' };
      default:
        return { bg: 'bg-gray-100 text-gray-600', label: 'Draft' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  // Calculate totals
  const totalTargetCtn = schedules.reduce((sum, s) => sum + s.target_ctn, 0);
  const totalScheduledCtn = schedules.reduce((sum, s) => sum + s.scheduled_ctn, 0);
  const totalRemainingCtn = schedules.reduce((sum, s) => sum + s.remaining_ctn, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rencana Produksi Bulanan</h1>
          <p className="text-gray-500">Kelola target produksi per bulan sebagai sumber jadwal mingguan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/production/scheduling')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Jadwal Mingguan
          </button>
          {schedules.length > 0 && schedules.some(s => s.status === 'draft') && (
            <button
              onClick={handleSubmitForApproval}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Submit for Approval
            </button>
          )}
          {schedules.length > 0 && (
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Print PDF
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            disabled={schedules.some(s => s.status === 'in_progress')}
          >
            <PlusIcon className="h-5 w-5" />
            Tambah Target
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-sm text-gray-500">
              {schedules.length} produk dijadwalkan
            </p>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{schedules.length}</p>
              <p className="text-xs text-gray-500">Total Produk</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalTargetCtn.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Target CTN</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalScheduledCtn.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Sudah Dijadwalkan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalRemainingCtn.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Sisa Belum Dijadwalkan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Target Produksi {MONTHS[currentMonth - 1]} {currentYear}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Target CTN</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Target Pack</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dijadwalkan</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sisa</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <CalendarDaysIcon className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">Belum ada target produksi untuk bulan ini</p>
                      <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Tambah Target Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                schedules.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
                  const priorityBadge = getPriorityBadge(item.priority);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.product_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.machine_code ? (
                          <span className="text-sm text-gray-700">{item.machine_code}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-amber-600">{item.target_ctn.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-600">{item.target_pack.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-1">({item.qty_per_ctn}/ctn)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-green-600">{item.scheduled_ctn.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.remaining_ctn > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.remaining_ctn.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.progress_percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(item.progress_percent, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">{item.progress_percent}%</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Hapus"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Cara Menggunakan</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>1. Tambahkan target produksi per produk untuk bulan ini</li>
              <li>2. Buka <strong>Jadwal Mingguan</strong> untuk breakdown target ke minggu-minggu</li>
              <li>3. Saat menambah jadwal mingguan, pilih dari daftar target bulanan yang tersedia</li>
              <li>4. Progress akan terupdate otomatis saat jadwal mingguan dibuat</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className={`px-6 py-4 rounded-t-2xl ${editingItem ? 'bg-amber-500' : 'bg-blue-600'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? 'Edit Target Produksi' : 'Tambah Target Produksi'}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produk <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={products.map((p) => ({
                    id: p.id,
                    code: p.code,
                    name: `${p.name} ${p.packs_per_karton ? `(${p.packs_per_karton}/ctn)` : ''}`
                  }))}
                  value={formData.product_id ? parseInt(formData.product_id) : null}
                  onChange={(val) => setFormData({ ...formData, product_id: val ? String(val) : '' })}
                  placeholder="Ketik untuk mencari produk..."
                  disabled={!!editingItem}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesin (Opsional)</label>
                <SearchableSelect
                  options={machines.map((m) => ({
                    id: m.id,
                    code: m.code,
                    name: m.name
                  }))}
                  value={formData.machine_id ? parseInt(formData.machine_id) : null}
                  onChange={(val) => setFormData({ ...formData, machine_id: val ? String(val) : '' })}
                  placeholder="Ketik untuk mencari mesin..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target (CTN) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.target_ctn}
                    onChange={(e) => setFormData({ ...formData, target_ctn: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCalcDisplay('0');
                      setCalcExpression('');
                      setShowCalculator(true);
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm"
                    title="Kalkulator"
                  >
                    🧮
                  </button>
                </div>
                {formData.target_ctn && formData.product_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {(parseFloat(formData.target_ctn) * (products.find(p => p.id === parseInt(formData.product_id))?.packs_per_karton || 0)).toLocaleString()} pack
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spek Kain</label>
                <input
                  type="text"
                  value={formData.spek_kain}
                  onChange={(e) => setFormData({ ...formData, spek_kain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 60x60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warna Penanda</label>
                <div className="flex gap-2 flex-wrap">
                  {SCHEDULE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className={`px-4 py-2 text-white rounded-lg ${editingItem ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {editingItem ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-72 overflow-hidden">
            <div className="bg-gray-800 p-4">
              <div className="text-right text-gray-400 text-sm h-5">{calcExpression || ' '}</div>
              <div className="text-right text-white text-3xl font-mono">{calcDisplay}</div>
            </div>
            <div className="grid grid-cols-4 gap-1 p-2 bg-gray-100">
              {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '00', '.', '='].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') {
                      setCalcDisplay('0');
                      setCalcExpression('');
                    } else if (btn === '±') {
                      setCalcDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d);
                    } else if (btn === '%') {
                      setCalcDisplay(d => String(parseFloat(d) / 100));
                    } else if (btn === '=') {
                      try {
                        const expr = calcExpression + calcDisplay;
                        const result = eval(expr.replace(/×/g, '*').replace(/÷/g, '/'));
                        setCalcDisplay(String(Math.round(result * 100) / 100));
                        setCalcExpression('');
                      } catch { setCalcDisplay('Error'); }
                    } else if (['+', '-', '×', '÷'].includes(btn)) {
                      setCalcExpression(calcExpression + calcDisplay + btn);
                      setCalcDisplay('0');
                    } else {
                      setCalcDisplay(d => d === '0' ? btn : d + btn);
                    }
                  }}
                  className={`p-3 text-lg font-semibold rounded-lg transition ${
                    btn === '=' ? 'bg-blue-500 text-white hover:bg-blue-600 col-span-1' :
                    ['+', '-', '×', '÷'].includes(btn) ? 'bg-orange-400 text-white hover:bg-orange-500' :
                    ['C', '±', '%'].includes(btn) ? 'bg-gray-300 hover:bg-gray-400' :
                    'bg-white hover:bg-gray-200'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
            <div className="flex gap-2 p-3 bg-gray-50 border-t">
              <button
                onClick={() => setShowCalculator(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (calcDisplay !== 'Error') {
                    setFormData({ ...formData, target_ctn: String(Math.round(parseFloat(calcDisplay))) });
                  }
                  setShowCalculator(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyProductionPlan;
