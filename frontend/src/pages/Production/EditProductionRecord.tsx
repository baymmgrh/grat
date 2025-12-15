import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, PlusIcon, TrashIcon, CogIcon, UserIcon, CubeIcon, PaintBrushIcon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

// Helper to disable scroll on number inputs
const disableScrollOnNumberInput = (e: React.WheelEvent<HTMLInputElement>) => {
  e.currentTarget.blur();
};

interface Employee {
  id: number;
  employee_id: string;
  name: string;
}

interface DowntimeEntry {
  id: number;
  reason: string;
  category: string;
  duration_minutes: string;
  frequency: string;
  pic: string;
}

interface ProductionRecord {
  id: number;
  work_order_id: number;
  production_date: string;
  shift: string;
  quantity_produced: number;
  quantity_good: number;
  quantity_scrap: number;
  quantity_rework?: number;
  quantity_setting?: number;
  downtime_minutes: number;
  operator_id: number | null;
  notes: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product_name: string;
  quantity: number;
  quantity_produced: number;
  pack_per_carton: number;
}

// Downtime categories
const DOWNTIME_CATEGORIES = {
  mesin: { label: 'Mesin', pic: 'MTC', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', icon: CogIcon },
  operator: { label: 'Operator', pic: 'SPV', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700', icon: UserIcon },
  material: { label: 'Material', pic: 'PPIC', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-700', icon: CubeIcon },
  design: { label: 'Design/Sanitasi', pic: 'QC', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700', icon: PaintBrushIcon },
  others: { label: 'Others', pic: '-', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700', icon: EllipsisHorizontalCircleIcon }
};

// Keywords for auto-detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  mesin: ['mesin', 'pisau', 'cutter', 'folding', 'macet', 'rusak', 'error', 'maintenance', 'belt', 'motor', 'sensor', 'bearing', 'gear', 'pompa', 'valve', 'nozzle', 'heater', 'cooler', 'compressor'],
  operator: ['setting', 'adjust', 'parameter', 'trial', 'training', 'istirahat', 'pergantian', 'shift'],
  material: ['kain', 'bahan', 'benang', 'habis', 'cacat', 'tunggu', 'stock', 'material', 'ingredient'],
  design: ['sanitasi', 'ganti stiker', 'ganti produk', 'ganti packaging', 'repack', 'cleaning', 'cuci', 'steril'],
  others: ['listrik', 'mati lampu', 'meeting', 'briefing', 'sholat', 'makan']
};

const detectCategory = (reason: string): string => {
  const lowerReason = reason.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerReason.includes(keyword))) {
      return category;
    }
  }
  return 'others';
};

export default function EditProductionRecord() {
  const { id: workOrderId, recordId } = useParams();
  const navigate = useNavigate();
  
  const [record, setRecord] = useState<ProductionRecord | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Downtime entries
  const [downtimeEntries, setDowntimeEntries] = useState<DowntimeEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  
  const [formData, setFormData] = useState({
    production_date: '',
    shift: '1',
    quantity_good: '',      // Grade A
    quantity_rework: '0',   // Grade B
    quantity_reject: '0',   // Grade C
    quantity_setting: '0',  // Setting
    quantity_produced: '0', // Auto: A+B+C
    quantity_waste: '0',    // Auto: C+Setting
    operator_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [workOrderId, recordId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordRes, woRes, empRes] = await Promise.all([
        axiosInstance.get(`/api/production/production-records/${recordId}`),
        axiosInstance.get(`/api/production/work-orders/${workOrderId}`),
        axiosInstance.get('/api/hr/employees')
      ]);
      
      const rec = recordRes.data.record;
      setRecord(rec);
      setWorkOrder(woRes.data.work_order);
      setEmployees(empRes.data.employees || []);
      
      // Parse downtime entries from notes if available
      const parsedEntries: DowntimeEntry[] = [];
      let cleanNotes = rec.notes || '';
      
      if (cleanNotes.includes('[Downtime Details]')) {
        const parts = cleanNotes.split('[Downtime Details]');
        cleanNotes = parts[0].trim();
        const downtimeSection = parts[1] || '';
        
        // Parse format: "10 menit - reason [category]"
        const lines = downtimeSection.split(';').map((l: string) => l.trim()).filter((l: string) => l);
        lines.forEach((line: string, idx: number) => {
          const match = line.match(/(\d+)\s*menit\s*-\s*(.+?)\s*\[(\w+)\]/);
          if (match) {
            const duration = match[1];
            const reason = match[2].trim();
            const category = match[3];
            parsedEntries.push({
              id: idx + 1,
              reason,
              category,
              duration_minutes: duration,
              frequency: '1',
              pic: DOWNTIME_CATEGORIES[category as keyof typeof DOWNTIME_CATEGORIES]?.pic || '-'
            });
          }
        });
        setNextEntryId(parsedEntries.length + 1);
      }
      
      // If no parsed entries but has downtime_minutes, create a single entry
      if (parsedEntries.length === 0 && rec.downtime_minutes > 0) {
        parsedEntries.push({
          id: 1,
          reason: 'Downtime (dari data sebelumnya)',
          category: 'others',
          duration_minutes: rec.downtime_minutes.toString(),
          frequency: '1',
          pic: '-'
        });
        setNextEntryId(2);
      }
      
      setDowntimeEntries(parsedEntries);
      
      // Populate form with existing data
      const prodDate = rec.production_date ? rec.production_date.split('T')[0] : '';
      setFormData({
        production_date: prodDate,
        shift: rec.shift || '1',
        quantity_good: rec.quantity_good?.toString() || '',
        quantity_rework: rec.quantity_rework?.toString() || '0',
        quantity_reject: rec.quantity_scrap?.toString() || '0',
        quantity_setting: rec.quantity_setting?.toString() || '0',
        quantity_produced: rec.quantity_produced?.toString() || '0',
        quantity_waste: ((rec.quantity_scrap || 0) + (rec.quantity_setting || 0)).toString(),
        operator_id: rec.operator_id?.toString() || '',
        notes: cleanNotes,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate when grade fields change
      if (field === 'quantity_good' || field === 'quantity_reject' || field === 'quantity_rework' || field === 'quantity_setting') {
        const gradeA = parseFloat(field === 'quantity_good' ? value : updated.quantity_good) || 0;
        const gradeC = parseFloat(field === 'quantity_reject' ? value : updated.quantity_reject) || 0;
        const gradeB = parseFloat(field === 'quantity_rework' ? value : updated.quantity_rework) || 0;
        const setting = parseFloat(field === 'quantity_setting' ? value : updated.quantity_setting) || 0;
        
        // qty_produced = Grade A + Grade B + Grade C
        const produced = gradeA + gradeB + gradeC;
        updated.quantity_produced = produced.toString();
        
        // Waste = Grade C + Setting
        const wastePack = gradeC + setting;
        updated.quantity_waste = wastePack.toString();
      }
      
      return updated;
    });
  };

  // Downtime entry handlers
  const addDowntimeEntry = () => {
    setDowntimeEntries(prev => [...prev, {
      id: nextEntryId,
      reason: '',
      category: '',
      duration_minutes: '',
      frequency: '1',
      pic: ''
    }]);
    setNextEntryId(prev => prev + 1);
  };

  const removeDowntimeEntry = (entryId: number) => {
    setDowntimeEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const updateDowntimeEntry = (entryId: number, field: keyof DowntimeEntry, value: string) => {
    setDowntimeEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      
      const updated = { ...entry, [field]: value };
      
      // Auto-detect category when reason changes
      if (field === 'reason') {
        const detectedCategory = detectCategory(value);
        updated.category = detectedCategory;
        updated.pic = DOWNTIME_CATEGORIES[detectedCategory as keyof typeof DOWNTIME_CATEGORIES]?.pic || '';
      }
      
      return updated;
    }));
  };

  // Calculate total downtime (duration × frequency)
  const getTotalDowntime = () => {
    return downtimeEntries.reduce((sum, e) => {
      const duration = parseInt(e.duration_minutes) || 0;
      const frequency = parseInt(e.frequency) || 1;
      return sum + (duration * frequency);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quantity_good || parseFloat(formData.quantity_good) <= 0) {
      toast.error('Grade A (Good) harus lebih dari 0');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Build downtime notes
      const downtimeNotes = downtimeEntries
        .filter(e => e.reason && e.duration_minutes)
        .map(e => {
          const total = (parseInt(e.duration_minutes) || 0) * (parseInt(e.frequency) || 1);
          return `${total} menit - ${e.reason} [${e.category}]`;
        })
        .join('; ');
      
      // Combine notes
      let finalNotes = formData.notes || '';
      if (downtimeNotes) {
        finalNotes = `${finalNotes}\n\n[Downtime Details]\n${downtimeNotes}`.trim();
      }
      
      const payload = {
        production_date: formData.production_date,
        shift: formData.shift,
        quantity_produced: parseFloat(formData.quantity_produced),
        quantity_good: parseFloat(formData.quantity_good),
        quantity_scrap: parseFloat(formData.quantity_reject),
        quantity_rework: parseFloat(formData.quantity_rework),
        quantity_setting: parseFloat(formData.quantity_setting),
        downtime_minutes: getTotalDowntime(),
        operator_id: formData.operator_id ? parseInt(formData.operator_id) : null,
        notes: finalNotes,
        downtime_entries: downtimeEntries.filter(e => e.reason && e.duration_minutes).map(e => ({
          reason: e.reason,
          category: e.category,
          duration_minutes: parseInt(e.duration_minutes) || 0,
          frequency: parseInt(e.frequency) || 1,
          total_minutes: (parseInt(e.duration_minutes) || 0) * (parseInt(e.frequency) || 1),
          pic: e.pic
        })),
      };
      
      await axiosInstance.put(`/api/production/production-records/${recordId}`, payload);
      
      toast.success('Data produksi berhasil diupdate!');
      navigate(`/app/production/work-orders/${workOrderId}`);
    } catch (error: any) {
      console.error('Error updating production record:', error);
      toast.error(error.response?.data?.error || 'Gagal mengupdate data produksi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!record || !workOrder) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Data tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={`/app/production/work-orders/${workOrderId}`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Data Produksi</h1>
          <p className="text-gray-600">{workOrder.wo_number} - {workOrder.product_name}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Perhatian:</strong> Mengubah data produksi akan mempengaruhi total produksi Work Order. 
          Pastikan data yang diinput sudah benar.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Date & Shift */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Produksi *
            </label>
            <input
              type="date"
              value={formData.production_date}
              onChange={(e) => handleChange('production_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift *
            </label>
            <select
              value={formData.shift}
              onChange={(e) => handleChange('shift', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="1">Shift 1 (07:00 - 15:00)</option>
              <option value="2">Shift 2 (15:00 - 23:00)</option>
              <option value="3">Shift 3 (23:00 - 07:00)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Downtime (menit)
            </label>
            <input
              type="number"
              value={formData.downtime_minutes}
              onChange={(e) => handleChange('downtime_minutes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
        </div>

        {/* Quantity Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hasil Produksi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade A <span className="text-green-600">(Good)</span> *
              </label>
              <input
                type="number"
                value={formData.quantity_good}
                onChange={(e) => handleChange('quantity_good', e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade B <span className="text-yellow-600">(Rework)</span>
              </label>
              <input
                type="number"
                value={formData.quantity_rework}
                onChange={(e) => handleChange('quantity_rework', e.target.value)}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade C <span className="text-red-500">(Reject)</span>
              </label>
              <input
                type="number"
                value={formData.quantity_reject}
                onChange={(e) => handleChange('quantity_reject', e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setting <span className="text-gray-500">(pack)</span>
              </label>
              <input
                type="number"
                value={formData.quantity_setting}
                onChange={(e) => handleChange('quantity_setting', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Auto-calculated */}
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Qty Produksi (Auto)
              </label>
              <input
                type="text"
                value={formData.quantity_produced}
                readOnly
                className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-800 font-medium cursor-not-allowed"
              />
              <span className="text-xs text-gray-500">= A + B + C</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-1">
                Waste (Auto)
              </label>
              <input
                type="text"
                value={formData.quantity_waste}
                readOnly
                className="w-full px-3 py-2 bg-orange-50 border border-orange-300 rounded-lg text-orange-700 font-medium cursor-not-allowed"
              />
              <span className="text-xs text-gray-500">= C + Setting</span>
            </div>
          </div>
        </div>

        {/* Downtime Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-orange-500" />
              Downtime Entries
            </h3>
            <button
              type="button"
              onClick={addDowntimeEntry}
              className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Tambah Downtime
            </button>
          </div>

          {downtimeEntries.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <ClockIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">Tidak ada downtime</p>
              <button
                type="button"
                onClick={addDowntimeEntry}
                className="mt-2 text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                + Tambah downtime jika ada
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {downtimeEntries.map((entry, index) => {
                const categoryConfig = entry.category ? DOWNTIME_CATEGORIES[entry.category as keyof typeof DOWNTIME_CATEGORIES] : null;
                const Icon = categoryConfig?.icon || ClockIcon;
                
                return (
                  <div key={entry.id} className={`p-4 rounded-lg border-2 ${categoryConfig ? categoryConfig.bgColor : 'bg-gray-50'} ${categoryConfig ? categoryConfig.borderColor : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${categoryConfig ? `${categoryConfig.bgColor} ${categoryConfig.textColor}` : 'bg-gray-200 text-gray-600'}`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                        {/* Reason */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Alasan Downtime
                          </label>
                          <input
                            type="text"
                            value={entry.reason}
                            onChange={(e) => updateDowntimeEntry(entry.id, 'reason', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="Contoh: temperature suhu rendah..."
                          />
                        </div>
                        
                        {/* Duration */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Durasi (menit)
                          </label>
                          <input
                            type="number"
                            value={entry.duration_minutes}
                            onChange={(e) => updateDowntimeEntry(entry.id, 'duration_minutes', e.target.value)}
                            onWheel={disableScrollOnNumberInput}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-center"
                            placeholder="0"
                            min="1"
                          />
                        </div>
                        
                        {/* Frequency */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Frekuensi
                          </label>
                          <input
                            type="number"
                            value={entry.frequency}
                            onChange={(e) => updateDowntimeEntry(entry.id, 'frequency', e.target.value)}
                            onWheel={disableScrollOnNumberInput}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-center"
                            placeholder="1"
                            min="1"
                          />
                        </div>
                        
                        {/* Total */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Total (menit)
                          </label>
                          <div className="px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg text-sm text-center font-bold text-orange-700">
                            {(parseInt(entry.duration_minutes) || 0) * (parseInt(entry.frequency) || 1)}
                          </div>
                        </div>
                        
                        {/* Category */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Kategori
                          </label>
                          {entry.category ? (
                            <div className={`px-3 py-2 rounded-lg text-sm ${categoryConfig?.bgColor} ${categoryConfig?.textColor} border ${categoryConfig?.borderColor}`}>
                              <div className="flex items-center gap-1 font-medium">
                                <Icon className="h-4 w-4" />
                                {categoryConfig?.label}
                              </div>
                            </div>
                          ) : (
                            <div className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-500 border border-gray-200 italic">
                              Auto
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeDowntimeEntry(entry.id)}
                        className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Hapus"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Downtime Summary */}
          {downtimeEntries.length > 0 && (
            <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
              <div className="flex justify-between items-center">
                <span className="font-medium text-orange-800">Total Downtime:</span>
                <span className="text-xl font-bold text-orange-700">{getTotalDowntime()} menit</span>
              </div>
            </div>
          )}
        </div>

        {/* Operator & Notes */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <select
                value={formData.operator_id}
                onChange={(e) => handleChange('operator_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Pilih Operator --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_id} - {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Link
            to={`/app/production/work-orders/${workOrderId}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
