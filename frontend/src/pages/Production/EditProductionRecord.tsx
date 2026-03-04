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
  setting_sticker?: number;
  setting_packaging?: number;
  downtime_minutes: number;
  planned_runtime?: number;
  operator_id: number | null;
  notes: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product_id: number;
  product_name: string;
  quantity: number;
  quantity_produced: number;
  pack_per_carton: number;
}

interface Product {
  id: number;
  code: string;
  name: string;
}

// Downtime categories
const DOWNTIME_CATEGORIES = {
  mesin: { label: 'Mesin', pic: 'MTC', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', icon: CogIcon },
  operator: { label: 'Operator', pic: 'SPV', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700', icon: UserIcon },
  material: { label: 'Material', pic: 'PPIC', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-700', icon: CubeIcon },
  design: { label: 'Design/Sanitasi', pic: 'QC', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700', icon: PaintBrushIcon },
  idle: { label: 'Idle Time', pic: 'Warehouse/PPIC', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700', icon: ClockIcon },
  others: { label: 'Others', pic: '-', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700', icon: EllipsisHorizontalCircleIcon }
};

// Keywords untuk auto-detect kategori dari alasan downtime
// Berdasarkan standar OEE dan referensi lokal pabrik
// PENTING: Urutan pengecekan = idle -> operator -> material -> mesin -> design -> others
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // IDLE: Menunggu material/resource - waktu tidak produktif bukan karena kerusakan
  idle: [
    'tunggu kain', 'tunggu stiker', 'tunggu packaging', 'tunggu mixing',
    'tunggu bahan', 'tunggu material', 'tunggu label', 'tunggu box',
    'tunggu karton', 'tunggu lem', 'tunggu tinta', 'tunggu order',
    'tunggu obat', 'tunggu ingredient', 'tunggu packing', 'tunggu instruksi',
    'tunggu approval', 'tunggu qc', 'tunggu hasil qc', 'tunggu bahan kimia',
    // Tunggu produk (dari mesin lain)
    'tunggu produk',
    // Tunggu temperatur
    'tunggu temperatur stabil', 'tunggu temperatur',
    'tunggu temperature stabil', 'tunggu temperature',
    'menunggu kain', 'menunggu stiker', 'menunggu packaging', 'menunggu mixing',
    'menunggu obat', 'menunggu ingredient',
    'nunggu kain', 'nunggu stiker', 'nunggu packaging', 'nunggu mixing',
    'kain habis', 'stiker habis', 'packing habis', 'packaging habis',
    'label habis', 'karton habis', 'box habis', 'lem habis', 'tinta habis',
    'bahan habis', 'material habis', 'ingredient habis', 'obat habis',
    'waiting for', 'standby material', 'standby', 'idle', 'menganggur',
    'tidak ada order', 'no order', 'no material', 'menghabiskan order'
  ],
  // MESIN (Machine/Equipment): Semua masalah teknis mesin dan komponen
  mesin: [
    'keluar jalur (bak mesin)', 'kain keluar jalur (bak mesin)', 'bak mesin',
    'seal', 'sealer', 'seal bocor', 'seal samping bocor', 'seal bawah bocor',
    'seal tidak ngeseal', 'seal bawah tdk ngeseal', 'sealer rusak',
    'pisau', 'pisau tumpul', 'pisau folding tumpul', 'pisau folding kotor',
    'cutter', 'cutter tumpul', 'blade', 'blade aus',
    'belt', 'belt putus', 'round belt putus', 'vanbelt', 'vanbelt putus',
    'conveyor', 'conveyor macet', 'conveyor slip',
    'infeeding', 'infeeding macet', 'infeeding macet total',
    'folding', 'lipatan', 'lipat', 'kain keluar lajur folding',
    'tumpukan kain tdk rapih', 'tumpukan kain tidak rapi',
    'selang', 'selang bocor', 'selang angin bocor',
    'pneumatic', 'pneumatic error', 'hidrolik', 'hidrolik bocor',
    'metal detector', 'metal detektor', 'detector putus',
    'inkjet', 'inkjet error', 'inkjet macet', 'printer inkjet',
    'temperature', 'temperatur', 'suhu', 'overheat', 'panas berlebih',
    'low temperature', 'suhu rendah', 'tekanan angin', 'tekanan angin drop',
    'motor', 'motor rusak', 'motor mati', 'bearing', 'bearing aus',
    'gear', 'gear rusak',
    'sensor', 'sensor error', 'sensor rusak',
    'pompa', 'pompa rusak', 'kompresor', 'kompresor mati',
    'heater', 'heater rusak', 'cooling', 'cooling error',
    'nozzle', 'nozzle mampet', 'valve', 'valve bocor',
    'cylinder', 'cylinder bocor',
    'mesin rusak', 'mesin error', 'mesin mati', 'mesin macet', 'mesin trouble',
    'breakdown', 'break down', 'kerusakan mesin', 'gangguan mesin',
    'press error', 'sparepart', 'maintenance', 'perbaikan mesin',
    'kalibrasi', 'service mesin'
  ],
  // MATERIAL (Raw Material): Masalah bahan baku
  material: [
    'keluar jalur (kain terlalu tipis)', 'keluar jalur (kain gembos)', 
    'keluar jalur (kain tidak sesuai)', 'kain terlalu tipis', 'kain gembos',
    'kain tidak sesuai',
    'kain rusak', 'kain cacat', 'kain sobek', 'kain kotor', 'kain belang',
    'kain jelek', 'kain reject', 'kain defect', 'kain tidak bagus',
    'bahan rusak', 'bahan cacat', 'bahan jelek', 'bahan reject',
    'material rusak', 'material cacat', 'material reject', 'material defect',
    'benang putus', 'benang kusut', 'roll rusak', 'roll cacat',
    'tunggu material', 'tunggu bahan', 'tunggu kain', 'material habis',
    'bahan habis', 'kain habis', 'shortage material', 'material shortage',
    'terlambat material', 'kurang material', 'tidak sesuai spec material',
    'fabric defect', 'yarn defect', 'raw material'
  ],
  // DESIGN CHANGE: Pergantian produk (kata "ganti"), sanitasi, cleaning
  design: [
    'ganti ukuran', 'ganti size', 'ganti warna', 'ganti stiker', 'ganti label', 
    'ganti packaging', 'ganti kemasan', 'ganti design', 'ganti desain',
    'ganti mixing', 'pergantian produk', 'pergantian artikel',
    'sanitasi', 'sanitasi dan setting', 'sterilisasi',
    'persiapan produksi',
    'obat habis',
    'changeover', 'change over',
    'cleaning', 'cuci mesin', 'bersih-bersih',
    'warmup', 'pemanasan', 'warm up',
    'repack', 'repacking',
    'setting packaging', 'setting kemasan',
    'setting mesin', 'setting mc',
    'setting dan tunggu temperatur', 'setting tunggu temperatur'
  ],
  // OPERATOR: Kesalahan manusia, setting (selain mesin/packaging), training
  operator: [
    'setting ulang', 'salah setting',
    'setup produk',
    'keluar jalur (sambungan)', 'kain keluar jalur (sambungan)', 'sambungan',
    'kesalahan operator', 'operator salah', 'human error',
    'salah parameter', 'salah input', 'salah prosedur', 'kelalaian operator',
    'adjust parameter', 'trial error', 'trial produk',
    'pergantian operator', 'operator baru', 'training operator',
    'briefing operator', 'operator tidak hadir', 'operator sakit',
    'operator izin', 'kurang operator', 'shortage operator'
  ],
  // OTHERS: Istirahat, ibadah, utilitas, banjir, tunggu air
  others: [
    'istirahat', 'istirahat makan', 'istirahat sholat', 'istirahat shalat',
    'break', 'makan', 'minum',
    'sholat', 'shalat', 'jumatan', 'ibadah',
    'listrik mati', 'listrik padam', 'mati lampu', 'power failure',
    'air mati', 'air habis', 'tunggu air', 'air panas',
    'sanitasi ruangan', 'banjir',
    'toilet', 'wc',
    'meeting', 'rapat', 'briefing', 'koordinasi',
    'lainnya', 'other', 'dll', 'etc'
  ]
};

// Function to auto-detect category from reason text
// Urutan pengecekan: operator -> material -> mesin -> design -> others
const detectCategory = (reason: string, isFirstEntry: boolean = false): string => {
  const lowerReason = reason.toLowerCase();
  
  // Urutan prioritas pengecekan:
  // 0. IDLE - untuk "tunggu kain/stiker/packaging/mixing" (prioritas tertinggi)
  // 1. OPERATOR - untuk "keluar jalur (sambungan)" 
  // 2. MATERIAL - untuk "keluar jalur (kain tipis/gembos/tidak sesuai)"
  // 3. MESIN - untuk "keluar jalur (bak mesin)" dan masalah mesin lainnya
  // 4. DESIGN - untuk changeover, sanitasi, setting
  // 5. OTHERS - default
  const categoryOrder = ['idle', 'operator', 'material', 'mesin', 'design', 'others'];
  
  for (const category of categoryOrder) {
    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      if (lowerReason.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Default to 'others' if no match
  return 'others';
};

export default function EditProductionRecord() {
  const { id: workOrderId, recordId } = useParams();
  const navigate = useNavigate();
  
  const [record, setRecord] = useState<ProductionRecord | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Downtime entries
  const [downtimeEntries, setDowntimeEntries] = useState<DowntimeEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  
  const [formData, setFormData] = useState({
    production_date: '',
    shift: '1',
    product_id: '',         // Product ID (default dari WO, bisa diganti)
    quantity_good: '',      // Grade A
    quantity_rework: '0',   // Grade B
    quantity_reject: '0',   // Grade C
    setting_sticker: '0',   // Setting Sticker
    setting_packaging: '0', // Setting Packaging
    quantity_produced: '0', // Auto: A+B+C
    quantity_waste: '0',    // Auto: C+Setting Sticker+Setting Packaging
    average_time: '510',    // Average time manual input
    machine_speed: '',      // Speed mesin (pcs/menit)
    operator_id: '',
    notes: '',
    // Early Stop / Shift Berhenti Lebih Awal
    early_stop: false as boolean,
    early_stop_time: '',
    early_stop_reason: '',
    early_stop_notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [workOrderId, recordId]);

  // Close product dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordRes, woRes, empRes, productsRes] = await Promise.all([
        axiosInstance.get(`/api/production/production-records/${recordId}`),
        axiosInstance.get(`/api/production/work-orders/${workOrderId}`),
        axiosInstance.get('/api/hr/employees'),
        axiosInstance.get('/api/products?status=active&per_page=500')
      ]);
      
      const rec = recordRes.data.record;
      setRecord(rec);
      setWorkOrder(woRes.data.work_order);
      setEmployees(empRes.data.employees || []);
      setProducts(productsRes.data.products || []);
      
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
            // Re-detect category from reason to fix old data with wrong category
            const isFirstEntry = idx === 0;
            const detectedCategory = detectCategory(reason, isFirstEntry);
            parsedEntries.push({
              id: idx + 1,
              reason,
              category: detectedCategory,
              duration_minutes: duration,
              frequency: '1',
              pic: DOWNTIME_CATEGORIES[detectedCategory as keyof typeof DOWNTIME_CATEGORIES]?.pic || '-'
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
      
      // Set selected product (from record or default to WO product)
      const productId = rec.product_id || woRes.data.work_order.product_id;
      setFormData({
        production_date: prodDate,
        shift: rec.shift || '1',
        product_id: productId?.toString() || '',
        quantity_good: rec.quantity_good?.toString() || '',
        quantity_rework: rec.quantity_rework?.toString() || '0',
        quantity_reject: rec.quantity_scrap?.toString() || '0',
        setting_sticker: rec.setting_sticker?.toString() || '0',
        setting_packaging: rec.setting_packaging?.toString() || '0',
        quantity_produced: rec.quantity_produced?.toString() || '0',
        quantity_waste: ((rec.quantity_scrap || 0) + (rec.setting_sticker || 0) + (rec.setting_packaging || 0)).toString(),
        average_time: rec.average_time?.toString() || '510',
        machine_speed: rec.machine_speed?.toString() || '',
        operator_id: rec.operator_id?.toString() || '',
        notes: cleanNotes,
        // Early Stop
        early_stop: rec.early_stop || false,
        early_stop_time: rec.early_stop_time || '',
        early_stop_reason: rec.early_stop_reason || '',
        early_stop_notes: rec.early_stop_notes || '',
      });
      
      // Set selected product for display
      if (rec.product_id && rec.product) {
        setSelectedProduct({
          id: rec.product_id,
          code: rec.product.code || '',
          name: rec.product.name || rec.product_name || ''
        });
      } else {
        // Default to WO product
        setSelectedProduct({
          id: woRes.data.work_order.product_id,
          code: '',
          name: woRes.data.work_order.product_name
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate when grade fields change
      if (field === 'quantity_good' || field === 'quantity_reject' || field === 'quantity_rework' || field === 'setting_sticker' || field === 'setting_packaging') {
        const strValue = String(value);
        const gradeA = parseFloat(field === 'quantity_good' ? strValue : updated.quantity_good) || 0;
        const gradeC = parseFloat(field === 'quantity_reject' ? strValue : updated.quantity_reject) || 0;
        const gradeB = parseFloat(field === 'quantity_rework' ? strValue : updated.quantity_rework) || 0;
        const settingSticker = parseFloat(field === 'setting_sticker' ? strValue : updated.setting_sticker) || 0;
        const settingPackaging = parseFloat(field === 'setting_packaging' ? strValue : updated.setting_packaging) || 0;
        
        // qty_produced = Grade A + Grade B + Grade C
        const produced = gradeA + gradeB + gradeC;
        updated.quantity_produced = produced.toString();
        
        // Waste = Grade C + Setting Sticker + Setting Packaging
        const wastePack = gradeC + settingSticker + settingPackaging;
        updated.quantity_waste = wastePack.toString();
      }
      
      return updated;
    });
  };

  // Product selection handler
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({ ...prev, product_id: product.id.toString() }));
    setProductSearch('');
    setShowProductDropdown(false);
  };

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10); // Limit to 10 results

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
    setDowntimeEntries(prev => prev.map((entry, index) => {
      if (entry.id !== entryId) return entry;
      
      const updated = { ...entry, [field]: value };
      
      // Auto-detect category when reason changes
      if (field === 'reason') {
        const isFirstEntry = index === 0;
        const detectedCategory = detectCategory(value, isFirstEntry);
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

  // Get average time from form (manual input, default 510)
  const getAverageTime = () => {
    return parseInt(formData.average_time) || 510;
  };

  // Calculate runtime = Grade A / speed mesin (in minutes)
  const getRuntime = () => {
    const gradeA = parseFloat(formData.quantity_good) || 0;
    const speed = parseFloat(formData.machine_speed) || 0;
    if (speed <= 0) return 0;
    return Math.round(gradeA / speed);
  };

  // Get waktu tercatat = runtime + downtime
  const getWaktuTercatat = () => {
    return getRuntime() + getTotalDowntime();
  };

  // Get waktu tidak tercatat = average_time - waktu_tercatat
  const getWaktuTidakTercatat = () => {
    return Math.max(0, getAverageTime() - getWaktuTercatat());
  };

  // Calculate efficiency: runtime / average_time * 100
  const getEfficiency = () => {
    const runtime = getRuntime();
    const avgTime = getAverageTime();
    const efficiency = avgTime > 0 ? (runtime / avgTime * 100) : 0;
    return Math.max(0, Math.min(100, efficiency));
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
        product_id: parseInt(formData.product_id) || null,
        quantity_produced: parseFloat(formData.quantity_produced),
        quantity_good: parseFloat(formData.quantity_good),
        quantity_scrap: parseFloat(formData.quantity_reject),
        quantity_rework: parseFloat(formData.quantity_rework),
        setting_sticker: parseFloat(formData.setting_sticker),
        setting_packaging: parseFloat(formData.setting_packaging),
        average_time: getAverageTime(),
        runtime: getRuntime(),
        waktu_tercatat: getWaktuTercatat(),
        waktu_tidak_tercatat: getWaktuTidakTercatat(),
        downtime_minutes: getTotalDowntime(),
        machine_speed: parseInt(formData.machine_speed) || 0,
        efficiency_rate: getEfficiency(),
        operator_id: formData.operator_id ? parseInt(formData.operator_id) : null,
        notes: finalNotes,
        // Early Stop / Shift Berhenti Lebih Awal
        early_stop: formData.early_stop,
        early_stop_time: formData.early_stop_time || null,
        early_stop_reason: formData.early_stop_reason || null,
        early_stop_notes: formData.early_stop_notes || null,
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
        {/* Product Selection */}
        <div className="relative product-dropdown-container">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Produk *
            <span className="text-xs text-gray-500 font-normal ml-2">(Default: produk WO, bisa diganti jika perlu)</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={showProductDropdown ? productSearch : (selectedProduct ? `${selectedProduct.code ? selectedProduct.code + ' - ' : ''}${selectedProduct.name}` : '')}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Cari produk..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Default WO Product */}
                  {workOrder && (
                    <button
                      type="button"
                      onClick={() => handleProductSelect({ id: workOrder.product_id, code: '', name: workOrder.product_name })}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-200 bg-blue-50"
                    >
                      <span className="text-xs text-blue-600 font-medium">Default WO:</span>
                      <span className="block text-sm font-medium">{workOrder.product_name}</span>
                    </button>
                  )}
                  {/* Search Results */}
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-xs text-gray-500">{product.code}</span>
                        <span className="block text-sm">{product.name}</span>
                      </button>
                    ))
                  ) : productSearch && (
                    <div className="px-3 py-2 text-sm text-gray-500">Tidak ada produk ditemukan</div>
                  )}
                </div>
              )}
            </div>
            {selectedProduct && selectedProduct.id !== workOrder?.product_id && (
              <button
                type="button"
                onClick={() => {
                  if (workOrder) {
                    handleProductSelect({ id: workOrder.product_id, code: '', name: workOrder.product_name });
                  }
                }}
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                title="Reset ke produk WO"
              >
                Reset
              </button>
            )}
          </div>
          {selectedProduct && selectedProduct.id !== workOrder?.product_id && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Produk berbeda dari WO default ({workOrder?.product_name})
            </p>
          )}
        </div>

        {/* Date & Shift */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <option value="1">Shift 1 (06:30 - 15:00)</option>
              <option value="2">Shift 2 (15:00 - 23:00)</option>
              <option value="3">Shift 3 (23:00 - 06:30)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waktu Kerja Shift (menit)
              <span className="text-xs text-gray-500 font-normal block">Kurangi jika shift berhenti lebih awal</span>
            </label>
            <input
              type="number"
              value={formData.average_time}
              onChange={(e) => handleChange('average_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="510"
              min="0"
            />
            <p className="text-xs text-gray-400 mt-1">Default: Shift 1=510, Shift 2=480, Shift 3=450</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speed Mesin (pcs/menit)
            </label>
            <input
              type="number"
              value={formData.machine_speed}
              onChange={(e) => handleChange('machine_speed', e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* Time Calculation Summary */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Perhitungan Waktu</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">Average Time</p>
              <p className="text-lg font-bold text-gray-700">{getAverageTime()}m</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Runtime</p>
              <p className="text-lg font-bold text-blue-600">{getRuntime()}m</p>
              <p className="text-xs text-gray-400">= A ÷ Speed</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Downtime</p>
              <p className="text-lg font-bold text-orange-600">{getTotalDowntime()}m</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Waktu Tercatat</p>
              <p className={`text-lg font-bold ${getWaktuTercatat() > getAverageTime() ? 'text-red-600' : 'text-green-600'}`}>
                {getWaktuTercatat()}m
              </p>
              {getWaktuTercatat() > getAverageTime() && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠ +{getWaktuTercatat() - getAverageTime()}m
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Waktu Tidak Tercatat</p>
              <p className="text-lg font-bold text-red-600">{getWaktuTidakTercatat()}m</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Efisiensi</p>
              <p className={`text-lg font-bold ${getEfficiency() >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {getEfficiency().toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hasil Produksi</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                Setting Sticker <span className="text-purple-500">(pack)</span>
              </label>
              <input
                type="number"
                value={formData.setting_sticker}
                onChange={(e) => handleChange('setting_sticker', e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setting Packaging <span className="text-indigo-500">(pack)</span>
              </label>
              <input
                type="number"
                value={formData.setting_packaging}
                onChange={(e) => handleChange('setting_packaging', e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Shift Berhenti Lebih Awal Section */}
        <div className="border-t pt-6">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="early_stop"
                checked={formData.early_stop}
                onChange={(e) => handleChange('early_stop', e.target.checked)}
                className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="early_stop" className="font-medium text-orange-800">
                ⚠️ Shift Berhenti Lebih Awal
              </label>
            </div>

            {formData.early_stop && (
              <div className="space-y-4 pl-6 border-l-2 border-orange-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Waktu Berhenti
                    </label>
                    <input
                      type="time"
                      value={formData.early_stop_time}
                      onChange={(e) => handleChange('early_stop_time', e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Alasan Berhenti
                    </label>
                    <select
                      value={formData.early_stop_reason}
                      onChange={(e) => handleChange('early_stop_reason', e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Pilih alasan...</option>
                      <option value="material_habis">Material Habis</option>
                      <option value="mesin_rusak">Mesin Rusak</option>
                      <option value="listrik_padam">Listrik Padam</option>
                      <option value="order_selesai">Order Selesai</option>
                      <option value="instruksi_atasan">Instruksi Atasan</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={formData.early_stop_notes}
                    onChange={(e) => handleChange('early_stop_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Jelaskan detail kondisi..."
                  />
                </div>
              </div>
            )}
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
              {/* Downtime vs Runtime indicator */}
              {record?.planned_runtime && getTotalDowntime() > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-orange-600">
                    ({((getTotalDowntime() / record.planned_runtime) * 100).toFixed(1)}% dari {record.planned_runtime}m)
                  </span>
                  <span className={`ml-2 font-medium ${
                    getTotalDowntime() > record.planned_runtime 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {getTotalDowntime() > record.planned_runtime 
                      ? `+${getTotalDowntime() - record.planned_runtime}m (melebihi runtime)` 
                      : `-${record.planned_runtime - getTotalDowntime()}m (sisa runtime)`}
                  </span>
                </div>
              )}
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
