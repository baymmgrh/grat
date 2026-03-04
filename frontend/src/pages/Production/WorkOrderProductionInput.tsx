import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, CogIcon, UserIcon, CubeIcon, PaintBrushIcon, EllipsisHorizontalCircleIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

// Helper to disable scroll on number inputs
const disableScrollOnNumberInput = (e: React.WheelEvent<HTMLInputElement>) => {
  e.currentTarget.blur();
};

interface ConsumptionData {
  berat_kering_per_pack: number;  // gram - for kain consumption
  volume_per_pack: number;        // ml - for ingredient consumption
  berat_akhir_per_pack: number;   // gram - for packaging & stiker consumption
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  quantity_produced: number;
  quantity_good: number;
  uom: string;
  machine_id: number;
  machine_name: string;
  machine_default_speed?: number;  // Default speed from machine settings
  status: string;
  pack_per_carton: number;
  consumption_data?: ConsumptionData;
  source_type?: string;  // manual, from_bom, from_schedule
  schedule_grid_id?: number;
  schedule_days?: { [date: string]: number[] };  // {"2025-12-08": [1, 2], "2025-12-09": [1]}
}

interface Employee {
  id: number;
  employee_id: string;
  name: string;
}

interface RosteredOperator {
  employee_id: number;
  employee_number: string;
  full_name: string;
  machine_id: number | null;
  machine_name: string | null;
  shift: string;
  is_backup: boolean;
}

interface DowntimeEntry {
  id: number;
  reason: string;
  category: string;
  duration_minutes: string;  // Duration per occurrence
  frequency: string;         // Number of occurrences
  pic: string;
}

// Downtime categories with PIC and limits
const DOWNTIME_CATEGORIES = {
  mesin: {
    label: 'Mesin',
    pic: 'MTC',
    maxPercent: 15,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    icon: CogIcon
  },
  operator: {
    label: 'Operator',
    pic: 'Supervisor Produksi',
    maxPercent: 7,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    icon: UserIcon
  },
  material: {
    label: 'Raw Material',
    pic: 'Warehouse',
    maxPercent: 0, // No limit, all counted
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-700',
    icon: CubeIcon
  },
  design: {
    label: 'Design Change',
    pic: 'Supervisor Produksi',
    maxPercent: 8,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    icon: PaintBrushIcon
  },
  idle: {
    label: 'Idle Time',
    pic: 'Warehouse/PPIC',
    maxPercent: 0, // No limit, tracked separately
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    icon: ClockIcon
  },
  others: {
    label: 'Others',
    pic: 'Supervisor Produksi',
    maxPercent: 10,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    icon: EllipsisHorizontalCircleIcon
  }
};

// Keywords untuk auto-detect kategori dari alasan downtime
// Berdasarkan standar OEE dan referensi lokal pabrik
// PENTING: Urutan pengecekan = idle -> mesin -> material -> design -> operator -> others
const CATEGORY_KEYWORDS = {
  // IDLE: Menunggu material/resource - waktu tidak produktif bukan karena kerusakan
  // Semua "tunggu xxx" dan "xxx habis" masuk ke idle
  idle: [
    // Tunggu kain
    'tunggu kain', 'menunggu kain', 'nunggu kain', 'kain belum datang',
    // Tunggu obat/tinta
    'tunggu obat', 'menunggu obat', 'nunggu obat', 'obat belum datang',
    'tunggu tinta', 'menunggu tinta', 'nunggu tinta',
    // Tunggu ingredient
    'tunggu ingredient', 'ingredient habis', 'tunggu bahan kimia',
    // Tunggu stiker
    'tunggu stiker', 'menunggu stiker', 'nunggu stiker', 'stiker belum datang',
    // Tunggu packing/packaging
    'tunggu packing', 'tunggu packaging', 'menunggu packing', 'nunggu packing',
    'packaging belum datang', 'box belum datang',
    // Tunggu mixing
    'tunggu mixing', 'menunggu mixing', 'nunggu mixing', 'mixing belum siap',
    // Tunggu label/karton/box
    'tunggu label', 'tunggu box', 'tunggu karton', 'tunggu lem',
    // Tunggu produk (dari mesin lain)
    'tunggu produk',
    // Tunggu temperatur
    'tunggu temperatur stabil', 'tunggu temperatur',
    'tunggu temperature stabil', 'tunggu temperature',
    // General tunggu
    'tunggu bahan', 'tunggu material', 'tunggu order', 'tunggu instruksi',
    'tunggu approval', 'tunggu qc', 'tunggu hasil qc',
    // xxx habis (idle karena kehabisan)
    'kain habis', 'stiker habis', 'packing habis', 'packaging habis',
    'label habis', 'karton habis', 'box habis', 'lem habis', 'tinta habis',
    'bahan habis', 'material habis',
    // English
    'waiting for', 'standby material', 'waiting material', 'no material',
    // Idle lainnya
    'idle', 'standby', 'menganggur', 'tidak ada order', 'no order',
    // Susun produk (idle karena menyusun produk, bukan kerusakan)
    'susun produk'
  ],
  // MESIN (Machine/Equipment): Semua masalah teknis mesin dan komponen
  // Referensi: seal bocor, pisau tumpul, belt putus, sensor error, dll
  mesin: [
    // Kain keluar jalur karena mesin (bak mesin)
    'keluar jalur (bak mesin)', 'kain keluar jalur (bak mesin)', 'bak mesin',
    // Seal & Sealer
    'seal', 'sealer', 'seal bocor', 'seal samping bocor', 'seal bawah bocor',
    'seal tidak ngeseal', 'seal bawah tdk ngeseal', 'sealer rusak',
    'perbaikan seal', 'perbaikan seal bawah', 'perbaikan seal samping',
    'seal samping', 'seal bawah',
    // Pisau & Cutter
    'pisau', 'pisau tumpul', 'pisau folding tumpul', 'pisau folding kotor',
    'cutter', 'cutter tumpul', 'blade', 'blade aus',
    // Belt & Conveyor
    'belt', 'belt putus', 'round belt putus', 'vanbelt', 'vanbelt putus',
    'conveyor', 'conveyor macet', 'conveyor slip',
    // Folding & Lipatan
    'folding', 'lipatan', 'lipat', 'kain keluar lajur folding',
    'tumpukan kain tdk rapih', 'tumpukan kain tidak rapi',
    // Selang & Pneumatic
    'selang', 'selang bocor', 'selang angin bocor',
    'pneumatic', 'pneumatic error', 'hidrolik', 'hidrolik bocor',
    // Metal Detector
    'metal detector', 'metal detektor', 'detector putus',
    // Inkjet Printer
    'inkjet', 'inkjet error', 'inkjet macet', 'printer inkjet',
    // Temperature & Suhu
    'temperature', 'temperatur', 'suhu', 'overheat', 'panas berlebih',
    'low temperature', 'suhu rendah', 'tekanan angin', 'tekanan angin drop',
    // Motor & Bearing
    'motor', 'motor rusak', 'motor mati', 'bearing', 'bearing aus',
    'gear', 'gear rusak',
    // Sensor & Elektrik
    'sensor', 'sensor error', 'sensor rusak',
    // Pompa & Kompresor
    'pompa', 'pompa rusak', 'kompresor', 'kompresor mati',
    // Heater & Cooling
    'heater', 'heater rusak', 'cooling', 'cooling error',
    // Nozzle & Valve
    'nozzle', 'nozzle mampet', 'valve', 'valve bocor',
    'cylinder', 'cylinder bocor',
    // Pound & Press
    'pound', 'pound tidak maksimal', 'pound kurang', 'pound lemah',
    'press', 'bak mesin press', 'mesin press', 'press error',
    // Stacker
    'stacker', 'stacker patah', 'stacker rusak', 'stacker error',
    // General mesin
    'mesin rusak', 'mesin error', 'mesin mati', 'mesin macet', 'mesin trouble',
    'breakdown', 'break down', 'kerusakan mesin', 'gangguan mesin',
    'sparepart', 'maintenance', 'perbaikan mesin', 'perbaikan',
    'kalibrasi', 'service mesin'
  ],
  // MATERIAL (Raw Material): Masalah bahan baku
  material: [
    // Kain keluar jalur karena kualitas kain (raw material issue)
    'keluar jalur (kain terlalu tipis)', 'keluar jalur (kain gembos)',
    'keluar jalur (kain tidak sesuai)', 'kain terlalu tipis', 'kain gembos',
    'kain tidak sesuai',
    // General material issues
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
  // Kata kunci utama: "ganti" = design change
  design: [
    // Ganti (semua yang ada kata "ganti" masuk design change)
    'ganti', 'ganti order', 'ganti produk', 'ganti artikel', 'ganti model',
    'ganti size', 'ganti warna', 'ganti stiker', 'ganti label',
    'ganti packaging', 'ganti kemasan', 'ganti design', 'ganti desain',
    'ganti mixing', 'pergantian produk', 'pergantian artikel',
    // Sanitasi
    'sanitasi', 'persiapan & sanitasi', 'sterilisasi',
    // Persiapan
    'persiapan produksi',
    // Obat habis
    'obat habis',
    // Changeover
    'changeover', 'change over',
    // Cleaning
    'cleaning', 'cuci mesin', 'bersih-bersih',
    // Warmup
    'warmup', 'pemanasan', 'warm up',
    // Repack
    'repack', 'repacking',
    // Setting dan tunggu temperatur (setup awal)
    'setting dan tunggu temperatur', 'setting tunggu temperatur'
  ],
  // OPERATOR: Kesalahan manusia, setting, training
  // Kata kunci utama: "setting" = operator
  operator: [
    // Setting (semua yang ada kata "setting" masuk operator)
    'setting', 'setting mc', 'setting mesin', 'setting ulang', 'salah setting',
    'setup produk', 'setup mesin',
    // Kain keluar jalur karena operator (sambungan)
    'keluar jalur (sambungan)', 'kain keluar jalur (sambungan)', 'sambungan',
    // Kesalahan operator
    'kesalahan operator', 'operator salah', 'human error',
    'salah parameter', 'salah input', 'salah prosedur', 'kelalaian operator',
    'adjust parameter', 'trial error', 'trial produk',
    // Pergantian/Training operator
    'pergantian operator', 'operator baru', 'training operator',
    'briefing operator', 'operator tidak hadir', 'operator sakit',
    'operator izin', 'kurang operator', 'shortage operator'
  ],
  // OTHERS: Istirahat, ibadah, utilitas, banjir, tunggu air
  // Referensi: istirahat makan, istirahat sholat, sanitasi ruangan (banjir), tunggu air
  others: [
    // Istirahat
    'istirahat', 'istirahat makan', 'istirahat sholat', 'istirahat shalat',
    'break', 'makan', 'minum',
    // Ibadah
    'sholat', 'shalat', 'jumatan', 'ibadah',
    // Listrik
    'listrik mati', 'listrik padam', 'mati lampu', 'power failure',
    // Air
    'air mati', 'air habis', 'tunggu air', 'air panas',
    // Sanitasi Ruangan
    'sanitasi ruangan', 'banjir',
    // Toilet
    'toilet', 'wc',
    // Meeting
    'meeting', 'rapat', 'briefing', 'koordinasi',
    // Lainnya
    'lainnya', 'other', 'dll', 'etc'
  ]
};

// Function to auto-detect category from reason text
// Urutan pengecekan: operator -> material -> mesin -> design -> others
// OPERATOR dan MATERIAL dicek duluan untuk "keluar jalur" dengan penyebab spesifik
const detectCategory = (reason: string, isFirstEntry: boolean = false): string => {
  const lowerReason = reason.toLowerCase();

  // SPECIAL CASE: "setting mc/mesin" - depends on position
  // If first entry → design (changeover/setup awal)
  // If not first → mesin (adjustment mesin)
  if (lowerReason.includes('setting mc') || lowerReason.includes('setting mesin')) {
    return isFirstEntry ? 'design' : 'mesin';
  }

  // Urutan prioritas pengecekan:
  // 0. IDLE - untuk "tunggu kain/stiker/packaging/mixing" (prioritas tertinggi)
  // 1. OPERATOR - untuk "keluar jalur (sambungan)" 
  // 2. MATERIAL - untuk "keluar jalur (kain tipis/gembos/tidak sesuai)"
  // 3. MESIN - untuk "keluar jalur (bak mesin)" dan masalah mesin lainnya
  // 4. DESIGN - untuk changeover, sanitasi
  // 5. OTHERS - default
  const categoryOrder = ['idle', 'operator', 'material', 'mesin', 'design', 'others'];

  for (const category of categoryOrder) {
    const keywords = CATEGORY_KEYWORDS[category as keyof typeof CATEGORY_KEYWORDS];
    for (const keyword of keywords) {
      if (lowerReason.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  // Default to 'others' if no match
  return 'others';
};

export default function WorkOrderProductionInput() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rosteredOperators, setRosteredOperators] = useState<RosteredOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRecords, setExistingRecords] = useState<any[]>([]);
  const [machineShiftRecords, setMachineShiftRecords] = useState<any[]>([]);

  // Product selection for multi-product per shift
  const [products, setProducts] = useState<{ id: number; code: string; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; code: string; name: string } | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Sub-shift selection for multi-product (manual selection)
  const [subShift, setSubShift] = useState<string | null>(null); // 'a', 'b', 'c' or null
  const [showSubShiftDialog, setShowSubShiftDialog] = useState(false);
  const [existingSubShifts, setExistingSubShifts] = useState<string[]>([]); // Track existing sub-shifts for current shift

  // Default planned runtime per shift (8.5 hours = 510 minutes)
  const DEFAULT_RUNTIME = 510;

  const [formData, setFormData] = useState({
    production_date: new Date().toISOString().split('T')[0],
    shift: '1',
    quantity_produced: '0', // Auto-calculated: Grade A + Grade B + Grade C
    quantity_good: '',      // Grade A - user input
    quantity_reject: '0',   // Grade C - user input
    quantity_rework: '0',   // Grade B - user input
    setting_sticker: '0',   // Setting sticker (pack)
    setting_packaging: '0', // Setting packaging (pack)
    quantity_waste: '0',    // Auto-calculated: Grade C + Setting Sticker + Setting Packaging
    // Waste per material type (auto-calculated from waste pack)
    waste_kain_kg: '0',
    waste_ingredient_kg: '0',
    waste_packaging_pcs: '0',
    waste_stiker_pcs: '0',
    operator_id: '',
    notes: '',
    average_time: '510',   // Average time manual input (default 510 menit)
    machine_speed: '',      // Speed mesin (pcs/menit) untuk perhitungan runtime
    pack_per_carton: '',    // Pack per karton (user input per shift)
    // Early Stop / Shift Interruption
    early_stop: false,
    early_stop_time: '',
    early_stop_reason: '',
    early_stop_notes: '',
    // Operator Reassignment
    operator_reassigned: false,
    reassignment_task: '',
    reassignment_notes: '',
  });

  // Downtime entries list
  const [downtimeEntries, setDowntimeEntries] = useState<DowntimeEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [draftRestored, setDraftRestored] = useState(false);

  // Mini Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrevValue, setCalcPrevValue] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<string | null>(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);

  // Calculator functions
  const calcInputDigit = (digit: string) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(digit);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const calcInputDot = () => {
    if (calcWaitingForOperand) {
      setCalcDisplay('0.');
      setCalcWaitingForOperand(false);
    } else if (!calcDisplay.includes('.')) {
      setCalcDisplay(calcDisplay + '.');
    }
  };

  const calcClear = () => {
    setCalcDisplay('0');
    setCalcPrevValue(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(false);
  };

  const calcPerformOperation = (nextOperator: string) => {
    const inputValue = parseFloat(calcDisplay);

    if (calcPrevValue === null) {
      setCalcPrevValue(inputValue);
    } else if (calcOperator) {
      const currentValue = calcPrevValue || 0;
      let result = currentValue;

      switch (calcOperator) {
        case '+': result = currentValue + inputValue; break;
        case '-': result = currentValue - inputValue; break;
        case '×': result = currentValue * inputValue; break;
        case '÷': result = inputValue !== 0 ? currentValue / inputValue : 0; break;
      }

      setCalcDisplay(String(result));
      setCalcPrevValue(result);
    }

    setCalcWaitingForOperand(true);
    setCalcOperator(nextOperator);
  };

  const calcEquals = () => {
    if (!calcOperator || calcPrevValue === null) return;

    const inputValue = parseFloat(calcDisplay);
    let result = calcPrevValue;

    switch (calcOperator) {
      case '+': result = calcPrevValue + inputValue; break;
      case '-': result = calcPrevValue - inputValue; break;
      case '×': result = calcPrevValue * inputValue; break;
      case '÷': result = inputValue !== 0 ? calcPrevValue / inputValue : 0; break;
    }

    setCalcDisplay(String(result));
    setCalcPrevValue(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(true);
  };

  const calcUseResult = () => {
    const result = Math.floor(parseFloat(calcDisplay));
    handleChange('quantity_good', result.toString());
    setShowCalculator(false);
    calcClear();
  };

  // Draft key for localStorage
  const getDraftKey = useCallback(() => `wo_production_draft_${id}`, [id]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!id || !draftRestored) return;

    const draftData = {
      formData,
      downtimeEntries,
      nextEntryId,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
  }, [formData, downtimeEntries, nextEntryId, id, draftRestored, getDraftKey]);

  // Default form data for merging with draft
  const defaultFormData = {
    production_date: new Date().toISOString().split('T')[0],
    shift: '1',
    quantity_produced: '0',
    quantity_good: '',
    quantity_reject: '0',
    quantity_rework: '0',
    setting_sticker: '0',
    setting_packaging: '0',
    quantity_waste: '0',
    waste_kain_kg: '0',
    waste_ingredient_kg: '0',
    waste_packaging_pcs: '0',
    waste_stiker_pcs: '0',
    operator_id: '',
    notes: '',
    average_time: '510',
    machine_speed: '',
  };

  // Restore draft on mount
  useEffect(() => {
    if (!id) return;

    const savedDraft = localStorage.getItem(getDraftKey());
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const savedAt = new Date(draft.savedAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

        // Only restore if draft is less than 24 hours old
        if (hoursDiff < 24) {
          const confirmRestore = window.confirm(
            `Draft ditemukan dari ${savedAt.toLocaleString()}. Apakah ingin melanjutkan draft tersebut?`
          );
          if (confirmRestore) {
            // Merge draft with default values to handle new fields
            const mergedFormData = { ...defaultFormData, ...draft.formData };
            setFormData(mergedFormData);
            // Ensure all downtime entries have frequency field
            const mergedDowntimeEntries = (draft.downtimeEntries || []).map((entry: any) => ({
              ...entry,
              frequency: entry.frequency || '1'  // Default frequency if missing
            }));
            setDowntimeEntries(mergedDowntimeEntries);
            setNextEntryId(draft.nextEntryId || 1);
            toast.success('Draft berhasil dipulihkan');
          } else {
            // Clear old draft if user doesn't want it
            localStorage.removeItem(getDraftKey());
          }
        } else {
          // Clear expired draft
          localStorage.removeItem(getDraftKey());
        }
      } catch (e) {
        console.error('Error restoring draft:', e);
        localStorage.removeItem(getDraftKey());
      }
    }
    setDraftRestored(true);
  }, [id, getDraftKey]);

  // Clear draft on successful submit
  const clearDraft = useCallback(() => {
    localStorage.removeItem(getDraftKey());
  }, [getDraftKey]);

  useEffect(() => {
    fetchData();
  }, [id]);

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

  // Update rostered operators when date or shift changes
  useEffect(() => {
    if (workOrder?.machine_id && formData.production_date && formData.shift) {
      fetchRosteredOperators(formData.production_date, formData.shift, workOrder.machine_id);
    }
  }, [formData.production_date, formData.shift, workOrder?.machine_id]);

  // Re-calculate waste when workOrder data is loaded
  useEffect(() => {
    if (workOrder && (formData.quantity_good || formData.quantity_reject || formData.quantity_rework || formData.setting_sticker || formData.setting_packaging)) {
      // Trigger waste calculation with current values
      const currentFields = ['quantity_good', 'quantity_reject', 'quantity_rework', 'setting_sticker', 'setting_packaging'];
      currentFields.forEach(field => {
        if (formData[field as keyof typeof formData]) {
          handleChange(field, formData[field as keyof typeof formData]);
        }
      });
    }
  }, [workOrder]);

  // Auto-select next available shift when production_date changes
  useEffect(() => {
    if (!formData.production_date || existingRecords.length === 0) return;

    if (workOrder?.source_type === 'from_schedule' && workOrder?.schedule_days) {
      const availableShifts = workOrder.schedule_days[formData.production_date] || [];
      if (availableShifts.length > 0) {
        const nextShift = getNextAvailableShift(existingRecords, formData.production_date);
        const autoShift = availableShifts.includes(parseInt(nextShift)) ? nextShift
          : availableShifts[0].toString();
        setFormData(prev => ({ ...prev, shift: autoShift }));
      }
    } else {
      // For manual WO, auto-detect next available shift
      const nextShift = getNextAvailableShift(existingRecords, formData.production_date);
      setFormData(prev => ({ ...prev, shift: nextShift }));
    }
  }, [formData.production_date, existingRecords]);

  // ShiftProduction records for current shift/date (for time usage calculation)
  // Uses machineShiftRecords which come from ShiftProduction table with accurate time data
  // Handle shift format: ProductionRecord uses '1', ShiftProduction uses 'shift_1'
  const normalizeShift = (shift: string) => shift?.replace('shift_', '') || '';
  const existingRecordsForCurrentShift = machineShiftRecords.filter(record => {
    const recordDate = new Date(record.production_date).toISOString().split('T')[0];
    return recordDate === formData.production_date && normalizeShift(record.shift) === formData.shift;
  });
  
  // Update existing sub-shifts when shift/date changes
  useEffect(() => {
    const subShifts = existingRecordsForCurrentShift
      .map((rec: any) => rec.sub_shift)
      .filter((s: string | null) => s !== null && s !== undefined);
    setExistingSubShifts(subShifts);
    
    // Auto-suggest next sub-shift if there are existing records
    if (existingRecordsForCurrentShift.length > 0 && !subShift) {
      const usedLetters = subShifts.map((s: string) => s?.toLowerCase());
      const nextLetter = ['a', 'b', 'c', 'd', 'e'].find(l => !usedLetters.includes(l)) || 'a';
      // Don't auto-set, let user choose
    }
  }, [existingRecordsForCurrentShift.length, formData.shift, formData.production_date]);
  
  // Get next available sub-shift letter
  const getNextSubShiftLetter = () => {
    const usedLetters = existingSubShifts.map(s => s?.toLowerCase());
    // Also check legacy records (those without sub_shift but in same shift)
    const legacyCount = existingRecordsForCurrentShift.filter((r: any) => !r.sub_shift).length;
    // If there are legacy records, they implicitly take 'a', 'b', etc based on order
    for (let i = 0; i < legacyCount; i++) {
      const letter = String.fromCharCode(97 + i); // 'a', 'b', 'c'...
      if (!usedLetters.includes(letter)) {
        usedLetters.push(letter);
      }
    }
    return ['a', 'b', 'c', 'd', 'e'].find(l => !usedLetters.includes(l)) || String.fromCharCode(97 + usedLetters.length);
  };

  // Calculate full shift duration based on shift number and day-of-week
  const getFullShiftDuration = (shiftNum: number, dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const isFriday = date.getDay() === 5;
    if (shiftNum === 1) return isFriday ? 540 : 510;
    if (shiftNum === 2) return 510;
    if (shiftNum === 3) return 450;
    return 510;
  };

  // Calculate time already used by existing records in the same shift
  const getExistingShiftUsage = () => {
    if (existingRecordsForCurrentShift.length === 0) return { usedTime: 0, records: [] };

    const records = existingRecordsForCurrentShift.map((rec: any) => {
      const runtime = rec.runtime || 0;
      const downtime = rec.downtime_minutes || 0;
      const idle = rec.idle_time || 0;
      return {
        productName: rec.product_name || 'Produk WO',
        gradeA: rec.quantity_good || 0,
        runtime,
        downtime,
        idle,
        totalUsed: rec.average_time || (runtime + downtime + idle),
      };
    });

    const usedTime = records.reduce((sum: number, r: any) => sum + r.totalUsed, 0);
    return { usedTime, records };
  };

  // Auto-update average_time based on shift, day-of-week, AND existing records
  // Backend uses: Shift 1 & 2 Mon-Thu = 510, Shift 1 Friday = 540, Shift 3 = 450
  useEffect(() => {
    if (!formData.production_date || !formData.shift) return;
    const shiftNum = parseInt(formData.shift);
    const fullDuration = getFullShiftDuration(shiftNum, formData.production_date);

    // If there are existing records in this shift, reduce available time
    const { usedTime } = getExistingShiftUsage();
    const remainingTime = Math.max(0, fullDuration - usedTime);

    const newAvgTime = usedTime > 0 ? remainingTime : fullDuration;

    setFormData(prev => ({ ...prev, average_time: newAvgTime.toString() }));
  }, [formData.production_date, formData.shift, machineShiftRecords]);

  // Auto-detect next available shift based on existing records
  const getNextAvailableShift = (records: any[], targetDate: string): string => {
    const shiftsWithData = records
      .filter(r => new Date(r.production_date).toISOString().split('T')[0] === targetDate)
      .map(r => r.shift);
    // If shift 1 already has data but shift 2 doesn't, default to shift 2
    if (shiftsWithData.includes('1') && !shiftsWithData.includes('2')) return '2';
    if (shiftsWithData.includes('2') && !shiftsWithData.includes('1')) return '1';
    // If both or neither have data, default to shift 1
    return '1';
  };


  const fetchRosteredOperators = async (date: string, shift: string, machineId?: number) => {
    try {
      const params: any = { date, shift: `shift_${shift}` };
      if (machineId) params.machine_id = machineId;

      const response = await axiosInstance.get('/api/hr/work-roster/operators/for-production', { params });
      if (response.data.success) {
        setRosteredOperators(response.data.operators || []);
      }
    } catch (error) {
      console.log('No rostered operators found');
      setRosteredOperators([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, empRes, recordsRes, productsRes] = await Promise.all([
        axiosInstance.get(`/api/production/work-orders/${id}`),
        axiosInstance.get('/api/hr/employees'),
        axiosInstance.get(`/api/production/work-orders/${id}/production-records`),
        axiosInstance.get('/api/products-new/?per_page=1000')
      ]);

      const workOrderData = woRes.data.work_order;
      const recordsData = recordsRes.data.records || [];
      // Include records from other WOs on the same machine (for shift usage calculation)
      const machineRecords = recordsRes.data.machine_records || [];
      const allRecords = [...recordsData, ...machineRecords];

      console.log('WorkOrder data loaded:', {
        wo_number: workOrderData?.wo_number,
        consumption_data: workOrderData?.consumption_data,
        pack_per_carton: workOrderData?.pack_per_carton,
        source_type: workOrderData?.source_type,
        schedule_days: workOrderData?.schedule_days
      });

      console.log('Existing production records:', recordsData.length, 'Machine records:', machineRecords.length);

      setWorkOrder(workOrderData);
      setEmployees(empRes.data.employees || []);
      // Map products-new fields to expected format (same as WorkOrderEdit)
      const mappedProducts = (productsRes.data.products || []).map((p: any) => ({
        id: p.id,
        code: p.kode_produk || p.code || '',
        name: p.nama_produk || p.name || '',
      }));
      setProducts(mappedProducts);

      // Set default product from WO
      if (workOrderData?.product_id && workOrderData?.product_name) {
        setSelectedProduct({
          id: workOrderData.product_id,
          code: workOrderData.product_code || '',
          name: workOrderData.product_name
        });
      }

      // Fetch rostered operators for WO scheduled_start_date (or today if not set), shift 1, and this machine
      const defaultDate = workOrderData?.scheduled_start_date
        ? new Date(workOrderData.scheduled_start_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      fetchRosteredOperators(defaultDate, '1', workOrderData?.machine_id);

      // Set existing records (this WO only) for next-shift auto-detection
      setExistingRecords(recordsData);
      // Set machine shift records (ShiftProduction) for shift time usage calculation
      setMachineShiftRecords(machineRecords);

      // Auto-fill machine_speed and pack_per_carton from WO
      setFormData(prev => {
        const updates: any = {};
        if (workOrderData?.machine_default_speed && workOrderData.machine_default_speed > 0 &&
          (!prev.machine_speed || prev.machine_speed === '' || prev.machine_speed === '0')) {
          updates.machine_speed = workOrderData.machine_default_speed.toString();
        }
        if (workOrderData?.pack_per_carton && workOrderData.pack_per_carton > 0 &&
          (!prev.pack_per_carton || prev.pack_per_carton === '')) {
          updates.pack_per_carton = workOrderData.pack_per_carton.toString();
        }
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });

      // Auto-set production_date and shift if WO is from schedule
      if (workOrderData?.source_type === 'from_schedule' && workOrderData?.schedule_days) {
        const scheduledDates = Object.keys(workOrderData.schedule_days).sort();
        const today = new Date().toISOString().split('T')[0];

        // Find today or the nearest future scheduled date
        let targetDate = scheduledDates.find(d => d >= today) || scheduledDates[0];

        if (targetDate) {
          const availableShifts = workOrderData.schedule_days[targetDate] || [];
          const nextShift = getNextAvailableShift(recordsData, targetDate);
          // Pick next available shift that is also in the schedule
          const autoShift = availableShifts.includes(parseInt(nextShift)) ? nextShift
            : availableShifts.length > 0 ? availableShifts[0].toString() : '1';
          setFormData(prev => ({
            ...prev,
            production_date: targetDate,
            shift: autoShift
          }));
        }
      } else if (workOrderData?.scheduled_start_date) {
        // For non-schedule WO, use the WO scheduled_start_date as default
        const woStartDate = new Date(workOrderData.scheduled_start_date).toISOString().split('T')[0];
        const nextShift = getNextAvailableShift(recordsData, woStartDate);
        setFormData(prev => ({
          ...prev,
          production_date: woStartDate,
          shift: nextShift
        }));
      } else {
        // For manual WO without scheduled_start_date, auto-detect shift for today
        const today = new Date().toISOString().split('T')[0];
        const nextShift = getNextAvailableShift(recordsData, today);
        setFormData(prev => ({
          ...prev,
          shift: nextShift
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate when relevant fields change
      // User inputs: qty_good (Grade A), qty_reject (Grade C), qty_rework (Grade B), setting_sticker, setting_packaging
      // Auto-calculated:
      //   qty_produced = Grade A + Grade B + Grade C (tanpa setting)
      //   waste (pack) = Grade C + Setting Sticker + Setting Packaging
      //   waste_kain_kg = (berat_kering / pack_per_karton) × waste_pack
      //   waste_ingredient_kg = (ingredient / pack_per_karton) × waste_pack
      //   waste_packaging_pcs = Grade C + Setting Packaging
      //   waste_stiker_pcs = Grade C + Setting Sticker
      if (field === 'quantity_good' || field === 'quantity_reject' || field === 'quantity_rework' || field === 'setting_sticker' || field === 'setting_packaging') {
        const strValue = typeof value === 'string' ? value : String(value);
        const gradeA = parseFloat(field === 'quantity_good' ? strValue : updated.quantity_good) || 0;
        const gradeC = parseFloat(field === 'quantity_reject' ? strValue : updated.quantity_reject) || 0;
        const gradeB = parseFloat(field === 'quantity_rework' ? strValue : updated.quantity_rework) || 0;
        const settingSticker = parseFloat(field === 'setting_sticker' ? strValue : updated.setting_sticker) || 0;
        const settingPackaging = parseFloat(field === 'setting_packaging' ? strValue : updated.setting_packaging) || 0;

        // qty_produced = Grade A + Grade B + Grade C (tanpa setting)
        const produced = gradeA + gradeB + gradeC;
        updated.quantity_produced = produced.toString();

        // Waste (pack) = Grade C + Setting Sticker + Setting Packaging
        const wastePack = gradeC + settingSticker + settingPackaging;
        updated.quantity_waste = wastePack.toString();

        // Auto-calculate waste materials - ALWAYS run with fallback values
        const packPerCarton = workOrder?.pack_per_carton || 1;

        // Multiple fallback levels for consumption data
        let beratKering = 0.8; // Default fallback
        let ingredient = 0.5; // Default fallback

        if (workOrder?.consumption_data) {
          beratKering = workOrder.consumption_data.berat_kering_per_pack || 0.8;
          ingredient = workOrder.consumption_data.volume_per_pack || 0.5;
        }

        console.log('Waste calculation details:', {
          workOrderNumber: workOrder?.wo_number,
          hasConsumptionData: !!workOrder?.consumption_data,
          consumption_data: workOrder?.consumption_data,
          packPerCarton,
          beratKering,
          ingredient,
          wastePack,
          calculation: `${beratKering} × ${wastePack} = ${beratKering * wastePack}`,
          expectedWasteKain: (beratKering * wastePack).toFixed(4),
          expectedWasteIngredient: (ingredient * wastePack).toFixed(4)
        });

        console.log('Waste calculation - ALWAYS running:', {
          hasWorkOrder: !!workOrder,
          workOrderNumber: workOrder?.wo_number,
          consumption_data: workOrder?.consumption_data,
          packPerCarton,
          beratKering,
          ingredient,
          wastePack,
          settingSticker,
          settingPackaging,
          field,
          value,
          formData: {
            quantity_good: formData.quantity_good,
            quantity_reject: formData.quantity_reject,
            quantity_rework: formData.quantity_rework,
            setting_sticker: formData.setting_sticker,
            setting_packaging: formData.setting_packaging
          }
        });

        // waste_kain_kg = berat_kering_per_pack × waste_pack
        const wasteKainKg = beratKering * wastePack;
        updated.waste_kain_kg = wasteKainKg.toFixed(4);

        // waste_ingredient_kg = ingredient_per_pack × waste_pack
        const wasteIngredientKg = ingredient * wastePack;
        updated.waste_ingredient_kg = wasteIngredientKg.toFixed(4);

        // waste_packaging = Grade C + Setting Packaging
        updated.waste_packaging_pcs = (gradeC + settingPackaging).toString();

        // waste_stiker = Grade C + Setting Sticker
        updated.waste_stiker_pcs = (gradeC + settingSticker).toString();
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
      frequency: '1',  // Default frequency = 1
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

      // Auto-detect category and PIC when reason text changes
      if (field === 'reason') {
        const isFirstEntry = index === 0;
        const detectedCategory = detectCategory(value, isFirstEntry);
        updated.category = detectedCategory;
        updated.pic = DOWNTIME_CATEGORIES[detectedCategory as keyof typeof DOWNTIME_CATEGORIES]?.pic || '';
      }

      return updated;
    }));
  };

  // Calculate downtime by category (duration × frequency)
  const getDowntimeByCategory = () => {
    const result: Record<string, number> = {
      mesin: 0,
      operator: 0,
      material: 0,
      design: 0,
      idle: 0,
      others: 0
    };

    downtimeEntries.forEach(entry => {
      if (entry.category && entry.duration_minutes) {
        const duration = parseInt(entry.duration_minutes) || 0;
        const frequency = parseInt(entry.frequency) || 1;
        result[entry.category] += duration * frequency;  // Total = duration × frequency
      }
    });

    return result;
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

  // Calculate total downtime (duration × frequency for each entry)
  const getTotalDowntime = () => {
    return downtimeEntries.reduce((sum, e) => {
      const duration = parseInt(e.duration_minutes) || 0;
      const frequency = parseInt(e.frequency) || 1;
      return sum + (duration * frequency);
    }, 0);
  };

  // Get waktu tercatat = runtime + downtime
  const getWaktuTercatat = () => {
    return getRuntime() + getTotalDowntime();
  };

  // Get waktu tidak tercatat = average_time - waktu_tercatat
  const getWaktuTidakTercatat = () => {
    return Math.max(0, getAverageTime() - getWaktuTercatat());
  };

  // Get downtime percentage for a category (based on average time)
  const getDowntimePercentage = (minutes: number) => {
    const avgTime = getAverageTime();
    return avgTime > 0 ? (minutes / avgTime * 100) : 0;
  };

  // Check if any category exceeds limit
  const getCategoryStatus = () => {
    const byCategory = getDowntimeByCategory();
    const status: Record<string, { minutes: number; percent: number; overLimit: boolean }> = {};

    Object.entries(DOWNTIME_CATEGORIES).forEach(([key, config]) => {
      const minutes = byCategory[key] || 0;
      const percent = getDowntimePercentage(minutes);
      const overLimit = config.maxPercent > 0 && percent > config.maxPercent;
      status[key] = { minutes, percent, overLimit };
    });

    return status;
  };

  // Check if any category is over limit
  const hasOverLimit = () => {
    const status = getCategoryStatus();
    return Object.values(status).some(s => s.overLimit);
  };

  // Product selection handler
  const handleProductSelect = (product: { id: number; code: string; name: string }) => {
    setSelectedProduct(product);
    setProductSearch('');
    setShowProductDropdown(false);
    
    // If changing to different product AND there are existing records in this shift,
    // show sub-shift dialog
    if (workOrder && product.id !== workOrder.product_id && existingRecordsForCurrentShift.length > 0) {
      setShowSubShiftDialog(true);
    } else if (workOrder && product.id === workOrder.product_id) {
      // Reset sub-shift if selecting WO default product
      setSubShift(null);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

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

      const byCategory = getDowntimeByCategory();

      const payload = {
        work_order_id: parseInt(id || '0'),
        product_id: selectedProduct?.id || workOrder?.product_id,  // Use selected product or WO default
        production_date: formData.production_date,
        shift: formData.shift,
        sub_shift: subShift,  // 'a', 'b', 'c' or null for single product shift
        quantity_produced: parseFloat(formData.quantity_produced),  // Auto: A+B+C
        quantity_good: parseFloat(formData.quantity_good),          // Grade A - user input
        quantity_reject: parseFloat(formData.quantity_reject),      // Grade C
        quantity_rework: parseFloat(formData.quantity_rework),      // Grade B
        setting_sticker: parseFloat(formData.setting_sticker),      // Setting sticker
        setting_packaging: parseFloat(formData.setting_packaging),  // Setting packaging
        quantity_waste: parseFloat(formData.quantity_waste),        // Auto: C + Setting Sticker + Setting Packaging
        // Waste materials (auto-calculated)
        waste_kain_kg: parseFloat(formData.waste_kain_kg) || 0,
        waste_ingredient_kg: parseFloat(formData.waste_ingredient_kg) || 0,
        waste_packaging_pcs: parseFloat(formData.waste_packaging_pcs) || 0,
        waste_stiker_pcs: parseFloat(formData.waste_stiker_pcs) || 0,
        average_time: getAverageTime(),
        runtime: getRuntime(),
        waktu_tercatat: getWaktuTercatat(),
        waktu_tidak_tercatat: getWaktuTidakTercatat(),
        downtime_minutes: getTotalDowntime(),
        machine_speed: parseInt(formData.machine_speed) || 0,
        // Downtime by category
        downtime_mesin: byCategory.mesin,
        downtime_operator: byCategory.operator,
        downtime_material: byCategory.material,
        downtime_design: byCategory.design,
        downtime_others: byCategory.others,
        idle_time: byCategory.idle,
        efficiency_rate: getEfficiency(),
        has_over_limit: hasOverLimit(),
        downtime_entries: downtimeEntries.filter(e => e.reason && e.duration_minutes).map(e => ({
          reason: e.reason,
          category: e.category,
          duration_minutes: parseInt(e.duration_minutes),
          frequency: parseInt(e.frequency) || 1,
          total_minutes: (parseInt(e.duration_minutes) || 0) * (parseInt(e.frequency) || 1),
          pic: e.pic
        })),
        pack_per_carton: parseInt(formData.pack_per_carton) || 0,
        operator_id: formData.operator_id ? parseInt(formData.operator_id) : null,
        notes: formData.notes,
        // Early Stop / Shift Interruption
        early_stop: formData.early_stop,
        early_stop_time: formData.early_stop_time || null,
        early_stop_reason: formData.early_stop_reason || null,
        early_stop_notes: formData.early_stop_notes || null,
        // Operator Reassignment
        operator_reassigned: formData.operator_reassigned,
        reassignment_task: formData.reassignment_task || null,
        reassignment_notes: formData.reassignment_notes || null,
      };

      const response = await axiosInstance.post(`/api/production/work-orders/${id}/production-records`, payload);

      // Show job costing info if available
      const data = response.data;
      let successMessage = 'Data produksi berhasil disimpan!';

      if (data.buffer_stock?.added_to_inventory) {
        successMessage += ` ${data.buffer_stock.message}`;
      }

      if (data.job_costing) {
        const jc = data.job_costing;
        const totalCost = jc.labor_cost + jc.overhead_cost;
        successMessage += ` | Biaya: Rp ${totalCost.toLocaleString('id-ID')}`;
      }

      toast.success(successMessage);
      clearDraft(); // Clear draft on successful submit
      navigate(`/app/production/work-orders/${id}`);
    } catch (error: any) {
      console.error('Error saving production data:', error);
      toast.error(error.response?.data?.error || 'Gagal menyimpan data produksi');
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

  if (!workOrder) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Work Order tidak ditemukan</p>
      </div>
    );
  }

  const remaining = workOrder.quantity - (workOrder.quantity_produced || 0);
  const qualityRate = formData.quantity_produced && parseFloat(formData.quantity_produced) > 0
    ? (parseFloat(formData.quantity_good) / parseFloat(formData.quantity_produced) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/app/production/work-orders/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Input Produksi</h1>
            <p className="text-gray-600">{workOrder.wo_number} - {workOrder.product_name}</p>
          </div>
        </div>
        <Link
          to={`/app/production/work-orders/${id}/bom-edit`}
          className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
        >
          <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
          Edit BOM WO
        </Link>
      </div>

      {/* Work Order Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-blue-600">Target</p>
            <p className="text-lg font-bold text-blue-800">{workOrder.quantity.toLocaleString()} {workOrder.uom}</p>
            {workOrder.pack_per_carton > 0 && (
              <p className="text-xs text-blue-500">
                = {(workOrder.quantity / workOrder.pack_per_carton).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Karton
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-blue-600">Sudah Diproduksi (Grade A)</p>
            <p className="text-lg font-bold text-blue-800">{(workOrder.quantity_good || 0).toLocaleString()} {workOrder.uom}</p>
            {workOrder.pack_per_carton > 0 && (
              <p className="text-xs text-blue-500">
                = {((workOrder.quantity_good || 0) / workOrder.pack_per_carton).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Karton
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-blue-600">Sisa</p>
            <p className="text-lg font-bold text-blue-800">{remaining.toLocaleString()} {workOrder.uom}</p>
            {workOrder.pack_per_carton > 0 && (
              <p className="text-xs text-blue-500">
                = {(remaining / workOrder.pack_per_carton).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Karton
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-blue-600">Pack/Karton</p>
            <p className="text-lg font-bold text-blue-800">{workOrder.pack_per_carton || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Mesin</p>
            <p className="text-lg font-bold text-blue-800">{workOrder.machine_name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Schedule Info - Show if WO is from schedule */}
        {workOrder?.source_type === 'from_schedule' && workOrder?.schedule_days && Object.keys(workOrder.schedule_days).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              📅 Jadwal Produksi
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(workOrder.schedule_days)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, shifts]) => {
                  const isSelected = date === formData.production_date;
                  const dateObj = new Date(date);
                  const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dateObj.getDay()];
                  const displayDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        const availableShifts = shifts as number[];
                        setFormData(prev => ({
                          ...prev,
                          production_date: date,
                          shift: availableShifts.length > 0 ? availableShifts[0].toString() : prev.shift
                        }));
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-300'
                        }`}
                    >
                      <div>{dayName} {displayDate}</div>
                      <div className="text-[10px] opacity-80">
                        Shift: {(shifts as number[]).join(', ')}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Existing Records Info for Current Shift */}
        {existingRecordsForCurrentShift.length > 0 && (() => {
          const shiftNum = parseInt(formData.shift);
          const fullDuration = getFullShiftDuration(shiftNum, formData.production_date);
          const { usedTime, records } = getExistingShiftUsage();
          const remainingTime = Math.max(0, fullDuration - usedTime);
          const isOverCapacity = usedTime >= fullDuration;

          return (
            <div className={`border rounded-lg p-4 ${isOverCapacity ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
              <p className={`text-sm font-semibold mb-2 ${isOverCapacity ? 'text-red-800' : 'text-amber-800'}`}>
                ⏱️ Multi-Produk di Shift {formData.shift} — {existingRecordsForCurrentShift.length} entry sebelumnya
              </p>
              <div className="space-y-1.5 mb-3">
                {records.map((rec: any, idx: number) => (
                  <div key={idx} className={`flex items-center justify-between text-xs ${isOverCapacity ? 'text-red-700' : 'text-amber-700'}`}>
                    <span>• {rec.productName}: Grade A = {rec.gradeA.toLocaleString()} pcs</span>
                    <span className="font-medium">{rec.totalUsed} menit</span>
                  </div>
                ))}
              </div>
              <div className={`flex items-center justify-between text-sm font-bold pt-2 border-t ${isOverCapacity ? 'border-red-200 text-red-800' : 'border-amber-200 text-amber-800'}`}>
                <span>Waktu Shift: {fullDuration} menit | Terpakai: {usedTime} menit</span>
                <span className={isOverCapacity ? 'text-red-600' : 'text-green-600'}>
                  Sisa: {remainingTime} menit
                </span>
              </div>
              {isOverCapacity ? (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ Waktu shift sudah habis! Entry baru akan ditambahkan sebagai lembur/overtime.
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-2">
                  💡 Average Time otomatis disesuaikan menjadi {remainingTime} menit (sisa waktu shift)
                </p>
              )}
            </div>
          );
        })()}

        {/* Product Selection */}
        <div className="product-dropdown-container relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Produk
            <span className="text-xs text-gray-500 font-normal ml-2">(Default: produk WO, bisa diganti jika ganti order)</span>
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
                      onClick={() => handleProductSelect({ id: workOrder.product_id, code: workOrder.product_code || '', name: workOrder.product_name })}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-200 bg-blue-50"
                    >
                      <span className="text-xs text-blue-600 font-medium">Default WO:</span>
                      <span className="block text-sm font-medium">{workOrder.product_code ? `${workOrder.product_code} - ` : ''}{workOrder.product_name}</span>
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
            {selectedProduct && workOrder && selectedProduct.id !== workOrder.product_id && (
              <button
                type="button"
                onClick={() => handleProductSelect({ id: workOrder.product_id, code: workOrder.product_code || '', name: workOrder.product_name })}
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-300"
              >
                Reset
              </button>
            )}
          </div>
          {selectedProduct && workOrder && selectedProduct.id !== workOrder.product_id && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Produk berbeda dari WO</p>
                <p className="text-xs text-yellow-700">
                  Produk WO: <strong>{workOrder.product_name}</strong>. Anda memilih: <strong>{selectedProduct.name}</strong>.
                  Data akan tercatat sebagai sub-shift terpisah di Daily Controller.
                </p>
              </div>
            </div>
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
              {workOrder?.source_type === 'from_schedule' && workOrder?.schedule_days && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  (dari jadwal produksi)
                </span>
              )}
            </label>
            <select
              value={formData.shift}
              onChange={(e) => handleChange('shift', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {(() => {
                // Get available shifts for selected date
                const availableShifts = workOrder?.source_type === 'from_schedule' && workOrder?.schedule_days
                  ? workOrder.schedule_days[formData.production_date] || []
                  : [1, 2, 3]; // Default all shifts for manual WO

                const shiftLabels: { [key: number]: string } = {
                  1: 'Shift 1 (06:30 - 15:00)',
                  2: 'Shift 2 (15:00 - 23:00)',
                  3: 'Shift 3 (23:00 - 06:30)'
                };

                if (availableShifts.length === 0) {
                  // No shifts scheduled for this date - show all shifts as fallback
                  return [1, 2, 3].map(shift => (
                    <option key={shift} value={shift.toString()}>
                      {shiftLabels[shift]}
                    </option>
                  ));
                }

                return availableShifts.map(shift => (
                  <option key={shift} value={shift.toString()}>
                    {shiftLabels[shift]}
                  </option>
                ));
              })()}
            </select>
            {workOrder?.source_type === 'from_schedule' && workOrder?.schedule_days &&
              !workOrder.schedule_days[formData.production_date] && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠ Tanggal ini tidak ada di jadwal. Pilih tanggal yang dijadwalkan.
                </p>
              )}
            {/* Sub-shift indicator */}
            {subShift && (
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                  Sub-Shift: {formData.shift}{subShift.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setSubShift(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ✕ Hapus
                </button>
              </div>
            )}
            {/* Show existing sub-shifts info */}
            {existingRecordsForCurrentShift.length > 0 && !subShift && (
              <p className="mt-1 text-xs text-blue-600">
                ℹ️ Shift ini sudah ada {existingRecordsForCurrentShift.length} entry. 
                {selectedProduct && workOrder && selectedProduct.id !== workOrder.product_id && (
                  <button
                    type="button"
                    onClick={() => setShowSubShiftDialog(true)}
                    className="ml-1 underline hover:text-blue-800"
                  >
                    Pilih sub-shift
                  </button>
                )}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Average Time (menit)
            </label>
            <input
              type="number"
              value={formData.average_time}
              onChange={(e) => handleChange('average_time', e.target.value)}
              onWheel={disableScrollOnNumberInput}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="510"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speed Mesin (pcs/menit)
            </label>
            <input
              type="number"
              value={formData.machine_speed}
              onChange={(e) => handleChange('machine_speed', e.target.value)}
              onWheel={disableScrollOnNumberInput}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pack/Karton *
            </label>
            <input
              type="number"
              value={formData.pack_per_carton}
              onChange={(e) => handleChange('pack_per_carton', e.target.value)}
              onWheel={disableScrollOnNumberInput}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-orange-50"
              placeholder="0"
              min="1"
              required
            />
          </div>
        </div>

        {/* Quantity Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hasil Produksi</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade A <span className="text-green-600">(Good)</span> *
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  title="Buka Kalkulator"
                >
                  🧮
                </button>
              </label>
              <input
                type="number"
                value={formData.quantity_good}
                onChange={(e) => handleChange('quantity_good', e.target.value)}
                onWheel={disableScrollOnNumberInput}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0"
                min="0"
                required
              />

              {/* Mini Calculator */}
              {showCalculator && (
                <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-3 w-56">
                  <div className="text-right bg-gray-100 p-2 rounded mb-2 font-mono text-lg overflow-hidden">
                    {calcDisplay}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button type="button" onClick={calcClear} className="col-span-2 p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium">C</button>
                    <button type="button" onClick={() => calcPerformOperation('÷')} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium">÷</button>
                    <button type="button" onClick={() => calcPerformOperation('×')} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium">×</button>

                    <button type="button" onClick={() => calcInputDigit('7')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">7</button>
                    <button type="button" onClick={() => calcInputDigit('8')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">8</button>
                    <button type="button" onClick={() => calcInputDigit('9')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">9</button>
                    <button type="button" onClick={() => calcPerformOperation('-')} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium">−</button>

                    <button type="button" onClick={() => calcInputDigit('4')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">4</button>
                    <button type="button" onClick={() => calcInputDigit('5')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">5</button>
                    <button type="button" onClick={() => calcInputDigit('6')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">6</button>
                    <button type="button" onClick={() => calcPerformOperation('+')} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium">+</button>

                    <button type="button" onClick={() => calcInputDigit('1')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">1</button>
                    <button type="button" onClick={() => calcInputDigit('2')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">2</button>
                    <button type="button" onClick={() => calcInputDigit('3')} className="p-2 bg-gray-100 rounded hover:bg-gray-200">3</button>
                    <button type="button" onClick={calcEquals} className="row-span-2 p-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium">=</button>

                    <button type="button" onClick={() => calcInputDigit('0')} className="col-span-2 p-2 bg-gray-100 rounded hover:bg-gray-200">0</button>
                    <button type="button" onClick={calcInputDot} className="p-2 bg-gray-100 rounded hover:bg-gray-200">.</button>
                  </div>
                  <button
                    type="button"
                    onClick={calcUseResult}
                    className="w-full mt-2 p-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm"
                  >
                    ✓ Gunakan untuk Grade A
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade B <span className="text-yellow-600">(Rework)</span>
              </label>
              <input
                type="number"
                value={formData.quantity_rework}
                onChange={(e) => handleChange('quantity_rework', e.target.value)}
                onWheel={disableScrollOnNumberInput}
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
                onWheel={disableScrollOnNumberInput}
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
                onWheel={disableScrollOnNumberInput}
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
                onWheel={disableScrollOnNumberInput}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Waste Material - Auto-calculated from waste pack */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="col-span-4 mb-2">
              <p className="text-sm font-medium text-orange-700">
                Waste Material (Auto) - dari {formData.quantity_waste} pack waste
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Kain <span className="text-blue-500">(kg)</span>
              </label>
              <input
                type="text"
                value={formData.waste_kain_kg}
                readOnly
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">= berat_kering × waste_pack</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Ingredient <span className="text-green-500">(kg)</span>
              </label>
              <input
                type="text"
                value={formData.waste_ingredient_kg}
                readOnly
                className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">= ingredient × waste_pack</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Packaging <span className="text-purple-500">(pcs)</span>
              </label>
              <input
                type="text"
                value={formData.waste_packaging_pcs}
                readOnly
                className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">= waste_pack</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Stiker <span className="text-orange-500">(pcs)</span>
              </label>
              <input
                type="text"
                value={formData.waste_stiker_pcs}
                readOnly
                className="w-full px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">= waste_pack</p>
            </div>
          </div>

          {/* Auto-calculated: Qty Produksi & Waste */}
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Qty Produksi (Auto)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.quantity_produced}
                  readOnly
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-800 font-medium cursor-not-allowed"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">= A + B + C</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-1">
                Waste (Auto) <span className="text-orange-500">(pack)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.quantity_waste}
                  readOnly
                  className="w-full px-3 py-2 bg-orange-50 border border-orange-300 rounded-lg text-orange-700 font-medium cursor-not-allowed"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">= C + Sticker + Packaging</span>
              </div>
            </div>
          </div>

          {/* Quality Rate Indicator */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Quality Rate:</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${parseFloat(qualityRate) >= 95 ? 'bg-green-100 text-green-800' :
              parseFloat(qualityRate) >= 85 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
              {qualityRate}%
            </span>
          </div>

          {/* Auto-calculated Consumption per Grade */}
          {workOrder?.consumption_data && (parseFloat(formData.quantity_good) > 0 || parseFloat(formData.quantity_waste) > 0) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">
                📊 Consumption per Grade (Auto-calculated)
              </h4>

              {/* Consumption per Grade Table */}
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Grade</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Qty (pack)</th>
                      <th className="px-3 py-2 text-right font-medium text-blue-700">Kain (kg)</th>
                      <th className="px-3 py-2 text-right font-medium text-green-700">Ingredient (kg)</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-700">Packaging (pcs)</th>
                      <th className="px-3 py-2 text-right font-medium text-orange-700">Stiker (pcs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Grade A */}
                    <tr className="bg-green-50">
                      <td className="px-3 py-2 font-medium text-green-700">Grade A (Good)</td>
                      <td className="px-3 py-2 text-right">{formData.quantity_good || 0}</td>
                      <td className="px-3 py-2 text-right text-blue-600">
                        {(parseFloat(formData.quantity_good || '0') * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {(parseFloat(formData.quantity_good || '0') * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">{formData.quantity_good || 0}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{formData.quantity_good || 0}</td>
                    </tr>
                    {/* Grade B */}
                    <tr className="bg-yellow-50">
                      <td className="px-3 py-2 font-medium text-yellow-700">Grade B (Rework)</td>
                      <td className="px-3 py-2 text-right">{formData.quantity_rework || 0}</td>
                      <td className="px-3 py-2 text-right text-blue-600">
                        {(parseFloat(formData.quantity_rework || '0') * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {(parseFloat(formData.quantity_rework || '0') * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">{formData.quantity_rework || 0}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{formData.quantity_rework || 0}</td>
                    </tr>
                    {/* Grade C */}
                    <tr className="bg-red-50">
                      <td className="px-3 py-2 font-medium text-red-700">Grade C (Reject)</td>
                      <td className="px-3 py-2 text-right">{formData.quantity_reject || 0}</td>
                      <td className="px-3 py-2 text-right text-blue-600">
                        {(parseFloat(formData.quantity_reject || '0') * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {(parseFloat(formData.quantity_reject || '0') * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">{formData.quantity_reject || 0}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{formData.quantity_reject || 0}</td>
                    </tr>
                    {/* Setting Sticker */}
                    <tr className="bg-purple-50">
                      <td className="px-3 py-2 font-medium text-purple-700">Setting Sticker</td>
                      <td className="px-3 py-2 text-right">{formData.setting_sticker || 0}</td>
                      <td className="px-3 py-2 text-right text-blue-600">
                        {(parseFloat(formData.setting_sticker || '0') * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {(parseFloat(formData.setting_sticker || '0') * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">{formData.setting_sticker || 0}</td>
                      <td className="px-3 py-2 text-right text-orange-600">0</td>
                    </tr>
                    {/* Setting Packaging */}
                    <tr className="bg-indigo-50">
                      <td className="px-3 py-2 font-medium text-indigo-700">Setting Packaging</td>
                      <td className="px-3 py-2 text-right">{formData.setting_packaging || 0}</td>
                      <td className="px-3 py-2 text-right text-blue-600">
                        {(parseFloat(formData.setting_packaging || '0') * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {(parseFloat(formData.setting_packaging || '0') * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">0</td>
                      <td className="px-3 py-2 text-right text-orange-600">{formData.setting_packaging || 0}</td>
                    </tr>
                    {/* Total */}
                    <tr className="bg-blue-100 font-bold">
                      <td className="px-3 py-2 text-blue-800">TOTAL</td>
                      <td className="px-3 py-2 text-right text-blue-800">
                        {parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0') + parseFloat(formData.setting_packaging || '0')}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-700">
                        {((parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0') + parseFloat(formData.setting_packaging || '0')) * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-700">
                        {((parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0') + parseFloat(formData.setting_packaging || '0')) * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-700">
                        {parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0')}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-700">
                        {parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_packaging || '0')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">Total Kain</p>
                  <p className="text-lg font-bold text-blue-700">
                    {((parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0') + parseFloat(formData.setting_packaging || '0')) * (workOrder.consumption_data.berat_kering_per_pack || 0)).toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">kg</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-500 mb-1">Total Ingredient</p>
                  <p className="text-lg font-bold text-green-700">
                    {((parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0') + parseFloat(formData.setting_packaging || '0')) * (workOrder.consumption_data.volume_per_pack || 0)).toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">kg</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  <p className="text-xs text-gray-500 mb-1">Total Packaging</p>
                  <p className="text-lg font-bold text-purple-700">
                    {parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_packaging || '0')}
                  </p>
                  <p className="text-xs text-gray-400">pcs</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-100">
                  <p className="text-xs text-gray-500 mb-1">Total Stiker</p>
                  <p className="text-lg font-bold text-orange-700">
                    {parseFloat(formData.quantity_produced || '0') + parseFloat(formData.setting_sticker || '0')}
                  </p>
                  <p className="text-xs text-gray-400">pcs</p>
                </div>
              </div>

              {(!workOrder.consumption_data.berat_kering_per_pack &&
                !workOrder.consumption_data.volume_per_pack) && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Data consumption belum ditemukan di Master Produk (berat_kering, ingredient)
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Downtime Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-orange-600" />
              Input Downtime
              {hasOverLimit() && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  Ada kategori melebihi limit!
                </span>
              )}
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

          {/* Downtime Entries */}
          {downtimeEntries.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mb-6">
              <ClockIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Tidak ada downtime</p>
              <button
                type="button"
                onClick={addDowntimeEntry}
                className="mt-2 text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                + Tambah downtime jika ada
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
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
                        {/* Reason Text Input - Auto detect category */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Alasan Downtime <span className="text-gray-400">(ketik bebas)</span>
                          </label>
                          <input
                            type="text"
                            value={entry.reason}
                            onChange={(e) => updateDowntimeEntry(entry.id, 'reason', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="Contoh: temperature suhu rendah..."
                          />
                        </div>

                        {/* Duration per occurrence */}
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

                        {/* Total (duration × frequency) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Total (menit)
                          </label>
                          <div className="px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg text-sm text-center font-bold text-orange-700">
                            {(parseInt(entry.duration_minutes) || 0) * (parseInt(entry.frequency) || 1)}
                          </div>
                        </div>

                        {/* Auto Category & PIC */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Kategori & PIC
                          </label>
                          {entry.category ? (
                            <div className={`px-3 py-2 rounded-lg text-sm ${categoryConfig?.bgColor} ${categoryConfig?.textColor} border ${categoryConfig?.borderColor}`}>
                              <div className="flex items-center gap-1 font-medium">
                                <Icon className="h-4 w-4" />
                                {categoryConfig?.label}
                              </div>
                              <div className="text-xs opacity-75">PIC: {entry.pic}</div>
                            </div>
                          ) : (
                            <div className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-500 border border-gray-200">
                              <div className="italic">Pilih alasan</div>
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

          {/* Keyword Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800 font-medium mb-2">Kategori otomatis berdasarkan keyword:</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs text-blue-700">
              <div><span className="font-medium text-red-600">Mesin:</span> mesin, pisau, cutter, macet, rusak, error, maintenance...</div>
              <div><span className="font-medium text-orange-600">Operator:</span> setting, adjust, parameter, trial, training...</div>
              <div><span className="font-medium text-yellow-600">Material:</span> kain, bahan, benang, habis, cacat, tunggu...</div>
              <div><span className="font-medium text-blue-600">Design:</span> sanitasi, ganti stiker/produk/packaging, repack, cleaning...</div>
              <div><span className="font-medium text-gray-600">Others:</span> istirahat, sholat, makan, meeting, listrik...</div>
            </div>
          </div>

          {/* Category Summary */}
          {getTotalDowntime() > 0 && (
            <div className="bg-white border rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan per Kategori</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(DOWNTIME_CATEGORIES).map(([key, config]) => {
                  const status = getCategoryStatus()[key];
                  const Icon = config.icon;

                  return (
                    <div key={key} className={`p-3 rounded-lg border-2 ${status.overLimit ? 'bg-red-50 border-red-400' : config.bgColor + ' ' + config.borderColor}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <Icon className={`h-4 w-4 ${status.overLimit ? 'text-red-600' : config.textColor}`} />
                        <span className={`text-xs font-medium ${status.overLimit ? 'text-red-600' : config.textColor}`}>
                          {config.label}
                        </span>
                        {status.overLimit && (
                          <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <div className={`text-lg font-bold ${status.overLimit ? 'text-red-600' : config.textColor}`}>
                        {status.minutes} menit
                      </div>
                      <div className={`text-xs ${status.overLimit ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {status.percent.toFixed(1)}%
                        {config.maxPercent > 0 && (
                          <span className={status.overLimit ? 'text-red-600' : 'text-gray-400'}>
                            {' '}(max {config.maxPercent}%)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        PIC: {config.pic}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Box - Time Calculations */}
          <div className={`rounded-lg p-4 ${hasOverLimit() ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-100'}`}>
            {hasOverLimit() && (
              <div className="flex items-center gap-2 mb-4 text-red-700">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">Perhatian: Ada kategori downtime yang melebihi limit!</span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {/* Average Time */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Average Time</p>
                <p className="text-xl font-bold text-gray-700">{getAverageTime()} menit</p>
                <p className="text-xs text-gray-400">(manual input)</p>
              </div>

              {/* Runtime = Grade A / Speed */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Runtime</p>
                <p className="text-xl font-bold text-blue-600">{getRuntime()} menit</p>
                <p className="text-xs text-gray-400">= Grade A ÷ Speed</p>
              </div>

              {/* Total Downtime */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Downtime</p>
                <p className="text-xl font-bold text-orange-600">{getTotalDowntime()} menit</p>
                <p className="text-xs text-gray-400">(dari entries)</p>
              </div>

              {/* Waktu Tercatat = Runtime + Downtime */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Waktu Tercatat</p>
                <p className={`text-xl font-bold ${getWaktuTercatat() > getAverageTime() ? 'text-red-600' : 'text-green-600'}`}>
                  {getWaktuTercatat()} menit
                </p>
                <p className="text-xs text-gray-400">= Runtime + Downtime</p>
                {getWaktuTercatat() > getAverageTime() && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    ⚠ Melebihi {getWaktuTercatat() - getAverageTime()} menit
                  </p>
                )}
              </div>

              {/* Waktu Tidak Tercatat = Average - Tercatat */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Waktu Tidak Tercatat</p>
                <p className={`text-xl font-bold ${getWaktuTidakTercatat() === 0 && getWaktuTercatat() > getAverageTime() ? 'text-red-600' : 'text-red-600'}`}>
                  {getWaktuTidakTercatat()} menit
                </p>
                <p className="text-xs text-gray-400">= Average - Tercatat</p>
              </div>

              {/* Efficiency = Runtime / Average Time */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Efisiensi</p>
                <p className={`text-2xl font-bold ${getEfficiency() >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {getEfficiency().toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">= Runtime ÷ Average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Operator & Notes */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
                {rosteredOperators.length > 0 && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    ✓ {rosteredOperators.length} operator dari roster
                  </span>
                )}
              </label>
              <select
                value={formData.operator_id}
                onChange={(e) => handleChange('operator_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Pilih Operator --</option>
                {rosteredOperators.length > 0 && (
                  <optgroup label="📋 Operator dari Roster">
                    {rosteredOperators.map(op => (
                      <option key={`roster-${op.employee_id}`} value={op.employee_id}>
                        {op.employee_number} - {op.full_name} {op.is_backup ? '(Backup)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="👥 Semua Karyawan">
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_id} - {emp.name}
                    </option>
                  ))}
                </optgroup>
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
                rows={2}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>
        </div>

        {/* Early Stop / Shift Interruption Section */}
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
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
                    <option value="material_habis">Material/Obat Habis</option>
                    <option value="mesin_rusak">Mesin Rusak</option>
                    <option value="listrik_mati">Listrik Mati</option>
                    <option value="target_tercapai">Target Sudah Tercapai</option>
                    <option value="order_cancel">Order Dibatalkan</option>
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

              {/* Operator Reassignment */}
              <div className="mt-4 pt-4 border-t border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="operator_reassigned"
                    checked={formData.operator_reassigned}
                    onChange={(e) => handleChange('operator_reassigned', e.target.checked)}
                    className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="operator_reassigned" className="font-medium text-orange-800">
                    👷 Operator Dialihkan ke Tugas Lain
                  </label>
                </div>

                {formData.operator_reassigned && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Dialihkan ke
                      </label>
                      <select
                        value={formData.reassignment_task}
                        onChange={(e) => handleChange('reassignment_task', e.target.value)}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Pilih tugas...</option>
                        <option value="packing_manual">Packing Manual</option>
                        <option value="mesin_lain">Mesin Lain</option>
                        <option value="cleaning">Cleaning/Bersih-bersih</option>
                        <option value="maintenance">Maintenance Support</option>
                        <option value="training">Training</option>
                        <option value="pulang">Pulang Lebih Awal</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        value={formData.reassignment_notes}
                        onChange={(e) => handleChange('reassignment_notes', e.target.value)}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="Detail pengalihan..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="border-t pt-6 flex justify-end gap-3">
          <Link
            to={`/app/production/work-orders/${id}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Simpan Data Produksi
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Sub-Shift Selection Dialog */}
      {showSubShiftDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Pilih Sub-Shift
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Anda mengganti produk di tengah shift. Pilih sub-shift untuk membedakan entry ini dari entry sebelumnya.
            </p>
            
            <div className="space-y-2 mb-4">
              {['a', 'b', 'c', 'd', 'e'].map((letter) => {
                const isUsed = existingSubShifts.includes(letter);
                const isLegacyUsed = existingRecordsForCurrentShift.some((r: any, idx: number) => 
                  !r.sub_shift && String.fromCharCode(97 + idx) === letter
                );
                const disabled = isUsed || isLegacyUsed;
                
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSubShift(letter);
                      setShowSubShiftDialog(false);
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      disabled
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-bold text-lg">Shift {formData.shift}{letter.toUpperCase()}</span>
                    {disabled && <span className="ml-2 text-xs">(sudah terpakai)</span>}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSubShiftDialog(false);
                  // Auto-select next available
                  setSubShift(getNextSubShiftLetter());
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Pilih Otomatis ({formData.shift}{getNextSubShiftLetter().toUpperCase()})
              </button>
              <button
                type="button"
                onClick={() => setShowSubShiftDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
