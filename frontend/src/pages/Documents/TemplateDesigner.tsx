import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  PlusIcon, TrashIcon, EyeIcon, DocumentArrowDownIcon,
  ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, XMarkIcon, CheckIcon,
  MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon,
  DocumentDuplicateIcon, ClipboardIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon,
  PrinterIcon, ArrowDownTrayIcon, ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

type BandType = 'title' | 'pageHeader' | 'detail' | 'detailMaterial' | 'detailExpense' | 'summary' | 'pageFooter';

interface Band {
  id: string;
  type: BandType;
  label: string;
  height: number;
  visible: boolean;
  elements: BandElement[];
}

interface BandElement {
  id: string;
  type: 'label' | 'field' | 'line' | 'box' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fieldPath?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  color?: string;
  zIndex?: number;
  imageSrc?: string;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

interface DragState {
  type: 'move' | 'resize';
  bandId: string;
  elementId: string;
  startX: number;
  startY: number;
  elX: number;
  elY: number;
  elWidth: number;
  elHeight: number;
  handle?: ResizeHandle;
}

const fieldLibrary: Record<string, Array<{ path: string; label: string }>> = {
  'Company': [
    { path: 'company.name', label: 'Nama Perusahaan' },
    { path: 'company.address', label: 'Alamat' },
    { path: 'company.phone', label: 'Telepon' },
  ],
  'Work Order': [
    { path: 'workOrder.number', label: 'Nomor WO' },
    { path: 'workOrder.transDate', label: 'Tanggal' },
    { path: 'workOrder.item.name', label: 'Produk Utama' },
    { path: 'workOrder.quantity', label: 'Kuantitas' },
    { path: 'workOrder.itemUnit.name', label: 'Satuan' },
    { path: 'workOrder.manufacturePlan', label: 'Rencana Produksi' },
    { path: 'workOrder.description', label: 'Keterangan' },
    { path: 'workOrder.totalMaterial', label: 'Total Bahan Baku' },
    { path: 'workOrder.totalExpense', label: 'Total Biaya' },
    { path: 'workOrder.totalAmount', label: 'Total' },
  ],
  'Material': [
    { path: 'workOrderMaterial.item.code', label: 'Kode Barang' },
    { path: 'workOrderMaterial.item.name', label: 'Nama Barang' },
    { path: 'workOrderMaterial.quantity', label: 'Qty' },
    { path: 'workOrderMaterial.itemUnit.name', label: 'Satuan' },
    { path: 'workOrderMaterial.unitPrice', label: 'Harga Standar' },
    { path: 'workOrderMaterial.amount', label: 'Total Harga' },
  ],
  'Expense': [
    { path: 'workOrderExpense.item.code', label: 'Kode Barang' },
    { path: 'workOrderExpense.item.name', label: 'Nama Barang' },
    { path: 'workOrderExpense.quantity', label: 'Qty' },
    { path: 'workOrderExpense.unitPrice', label: 'Harga' },
    { path: 'workOrderExpense.amount', label: 'Total' },
  ],
  'Sales Order': [
    { path: 'salesOrder.number', label: 'Nomor SO' },
    { path: 'salesOrder.orderDate', label: 'Tanggal' },
    { path: 'salesOrder.customer.name', label: 'Customer' },
    { path: 'salesOrder.customer.address', label: 'Alamat' },
    { path: 'salesOrder.totalAmount', label: 'Total' },
  ],
};

const bandLabels: Record<BandType, string> = {
  title: 'Title', pageHeader: 'Page Header', detail: 'Detail',
  detailMaterial: 'Detail Material', detailExpense: 'Detail Expense',
  summary: 'Summary', pageFooter: 'Page Footer'
};

const paperSizes: Record<string, { width: number; height: number; label: string }> = {
  'A4': { width: 210, height: 297, label: 'A4 - 210 x 297 mm' },
  'F4': { width: 210, height: 330, label: 'F4 - 210 x 330 mm' },
  'A5': { width: 148, height: 210, label: 'A5 - 148 x 210 mm' },
  'Letter': { width: 216, height: 279, label: 'Letter - 216 x 279 mm' },
};

// All document types like Accurate 5
const documentTypes = [
  // Penjualan
  { value: 'penawaran_penjualan', label: 'Penawaran Penjualan', category: 'Penjualan' },
  { value: 'pesanan_penjualan', label: 'Pesanan Penjualan', category: 'Penjualan' },
  { value: 'pengiriman_pesanan', label: 'Pengiriman Pesanan', category: 'Penjualan' },
  { value: 'faktur_penjualan', label: 'Faktur Penjualan', category: 'Penjualan' },
  { value: 'retur_penjualan', label: 'Retur Penjualan', category: 'Penjualan' },
  { value: 'penerimaan_penjualan', label: 'Penerimaan Penjualan', category: 'Penjualan' },
  { value: 'uang_muka_penjualan', label: 'Uang Muka Penjualan', category: 'Penjualan' },
  { value: 'klaim_pelanggan', label: 'Klaim Pelanggan', category: 'Penjualan' },
  { value: 'target_penjualan', label: 'Target Penjualan', category: 'Penjualan' },
  
  // Pembelian
  { value: 'permintaan_barang', label: 'Permintaan Barang', category: 'Pembelian' },
  { value: 'pesanan_pembelian', label: 'Pesanan Pembelian', category: 'Pembelian' },
  { value: 'penerimaan_barang', label: 'Penerimaan Barang', category: 'Pembelian' },
  { value: 'faktur_pembelian', label: 'Faktur Pembelian', category: 'Pembelian' },
  { value: 'retur_pembelian', label: 'Retur Pembelian', category: 'Pembelian' },
  { value: 'pembayaran_pembelian', label: 'Pembayaran Pembelian', category: 'Pembelian' },
  { value: 'uang_muka_pembelian', label: 'Uang Muka Pembelian', category: 'Pembelian' },
  { value: 'klaim_pemasok', label: 'Klaim Pemasok', category: 'Pembelian' },
  
  // Persediaan
  { value: 'pemindahan_barang', label: 'Pemindahan Barang', category: 'Persediaan' },
  { value: 'penyesuaian_persediaan', label: 'Penyesuaian Persediaan', category: 'Persediaan' },
  { value: 'perintah_stok_opname', label: 'Perintah Stok Opname', category: 'Persediaan' },
  { value: 'pengepakan_barang', label: 'Pengepakan Barang', category: 'Persediaan' },
  { value: 'pindah_aset', label: 'Pindah Aset', category: 'Persediaan' },
  
  // Produksi / Manufaktur
  { value: 'formula_produksi', label: 'Formula Produksi', category: 'Produksi' },
  { value: 'perintah_kerja', label: 'Perintah Kerja', category: 'Produksi' },
  { value: 'penyelesaian_barang_jadi', label: 'Penyelesaian Barang Jadi', category: 'Produksi' },
  { value: 'penambahan_bahan_baku', label: 'Penambahan Bahan Baku', category: 'Produksi' },
  { value: 'pengambilan_bahan_baku', label: 'Pengambilan Bahan Baku', category: 'Produksi' },
  { value: 'persiapan_bahan_baku', label: 'Persiapan Bahan Baku', category: 'Produksi' },
  { value: 'rencana_produksi', label: 'Rencana Produksi', category: 'Produksi' },
  { value: 'tahapan_proses', label: 'Tahapan Proses', category: 'Produksi' },
  
  // Keuangan
  { value: 'penerimaan', label: 'Penerimaan', category: 'Keuangan' },
  { value: 'pembayaran', label: 'Pembayaran', category: 'Keuangan' },
  { value: 'transfer_bank', label: 'Transfer Bank', category: 'Keuangan' },
  { value: 'jurnal_umum', label: 'Jurnal Umum', category: 'Keuangan' },
  { value: 'pencatatan_beban', label: 'Pencatatan Beban', category: 'Keuangan' },
  { value: 'anggaran', label: 'Anggaran', category: 'Keuangan' },
  { value: 'tukar_faktur', label: 'Tukar Faktur', category: 'Keuangan' },
  { value: 'daftar_penagihan', label: 'Daftar Penagihan', category: 'Keuangan' },
  
  // Pekerjaan
  { value: 'pekerjaan_pesanan', label: 'Pekerjaan Pesanan', category: 'Pekerjaan' },
  { value: 'penyelesaian_pesanan', label: 'Penyelesaian Pesanan', category: 'Pekerjaan' },
  
  // HR
  { value: 'slip_gaji', label: 'Slip Gaji', category: 'HR' },
];

export default function TemplateDesigner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [templateName, setTemplateName] = useState('');
  const [documentType, setDocumentType] = useState('perintah_kerja');
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margins, setMargins] = useState({ left: 12, right: 12, top: 14, bottom: 11 });
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Company']);
  const [draggedField, setDraggedField] = useState<{ path: string; label: string } | null>(null);
  
  // Drag to reposition & resize
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  // Clipboard & History
  const [clipboard, setClipboard] = useState<BandElement | null>(null);
  const [history, setHistory] = useState<Band[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Preview mode
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Grid & Snap
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 5; // 5mm grid

  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Snap value to grid
  const snapValue = (val: number) => snapToGrid ? Math.round(val / gridSize) * gridSize : val;
  const paper = paperSizes[paperSize];
  const canvasWidth = orientation === 'portrait' ? paper.width : paper.height;
  const scale = 2.5;

  useEffect(() => {
    if (isEdit) loadTemplate();
    else initBands();
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/documents/templates/${id}`);
      const t = res.data.template;
      setTemplateName(t.template_name || '');
      setDocumentType(t.document_type || 'work_order');
      setPaperSize(t.paper_size || 'A4');
      setOrientation(t.orientation || 'portrait');
      setMargins(t.margins || { left: 12, right: 12, top: 14, bottom: 11 });
      if (t.template_structure?.bands) setBands(t.template_structure.bands);
      else initBands();
    } catch { toast.error('Failed to load'); navigate('/app/documents/templates'); }
    finally { setLoading(false); }
  };

  const initBands = () => {
    const types: BandType[] = ['title', 'pageHeader', 'detailMaterial', 'detailExpense', 'summary', 'pageFooter'];
    setBands(types.map((type, i) => ({
      id: `band-${i}`, type, label: bandLabels[type],
      height: type === 'title' ? 35 : type === 'pageHeader' ? 50 : 30,
      visible: true, elements: getDefaultElements(type)
    })));
  };

  const getDefaultElements = (type: BandType): BandElement[] => {
    const w = canvasWidth - margins.left - margins.right;
    if (type === 'title') return [
      { id: 'e1', type: 'field', x: 0, y: 5, width: w, height: 12, fieldPath: 'company.name', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
      { id: 'e2', type: 'field', x: 0, y: 18, width: w, height: 8, fieldPath: 'company.address', fontSize: 10, textAlign: 'center', color: '#666' }
    ];
    if (type === 'pageHeader') return [
      { id: 'e3', type: 'label', x: 0, y: 5, width: 80, height: 10, content: 'Perintah Kerja', fontSize: 14, fontWeight: 'bold' },
      { id: 'e4', type: 'label', x: 0, y: 18, width: 35, height: 6, content: 'Nomor', fontSize: 9 },
      { id: 'e5', type: 'field', x: 37, y: 18, width: 50, height: 6, fieldPath: 'workOrder.number', fontSize: 9 },
      { id: 'e6', type: 'label', x: 0, y: 26, width: 35, height: 6, content: 'Tanggal', fontSize: 9 },
      { id: 'e7', type: 'field', x: 37, y: 26, width: 50, height: 6, fieldPath: 'workOrder.transDate', fontSize: 9 },
      { id: 'e8', type: 'label', x: 100, y: 18, width: 35, height: 6, content: 'Produk Utama', fontSize: 9 },
      { id: 'e9', type: 'field', x: 137, y: 18, width: 50, height: 6, fieldPath: 'workOrder.item.name', fontSize: 9 },
      { id: 'e10', type: 'label', x: 100, y: 26, width: 35, height: 6, content: 'Kuantitas', fontSize: 9 },
      { id: 'e11', type: 'field', x: 137, y: 26, width: 25, height: 6, fieldPath: 'workOrder.quantity', fontSize: 9 },
      { id: 'e12', type: 'label', x: 100, y: 34, width: 35, height: 6, content: 'Satuan', fontSize: 9 },
      { id: 'e13', type: 'field', x: 137, y: 34, width: 25, height: 6, fieldPath: 'workOrder.itemUnit.name', fontSize: 9 },
    ];
    if (type === 'detailMaterial') return [
      { id: 'dm1', type: 'box', x: 0, y: 0, width: w, height: 8, backgroundColor: '#4A90D9', borderWidth: 0 },
      { id: 'dm2', type: 'label', x: 0, y: 1, width: w, height: 6, content: 'Bahan Baku', fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#FFF' },
      { id: 'dm3', type: 'label', x: 0, y: 10, width: 30, height: 6, content: 'Kode Barang', fontSize: 8, fontWeight: 'bold', backgroundColor: '#E8E8E8' },
      { id: 'dm4', type: 'label', x: 32, y: 10, width: 55, height: 6, content: 'Nama Barang', fontSize: 8, fontWeight: 'bold', backgroundColor: '#E8E8E8' },
      { id: 'dm5', type: 'label', x: 89, y: 10, width: 18, height: 6, content: 'Qty', fontSize: 8, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#E8E8E8' },
      { id: 'dm6', type: 'label', x: 109, y: 10, width: 22, height: 6, content: 'Satuan', fontSize: 8, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#E8E8E8' },
      { id: 'dm7', type: 'label', x: 133, y: 10, width: 28, height: 6, content: 'Harga Standar', fontSize: 8, fontWeight: 'bold', textAlign: 'right', backgroundColor: '#E8E8E8' },
      { id: 'dm8', type: 'label', x: 163, y: 10, width: 23, height: 6, content: 'Total Harga', fontSize: 8, fontWeight: 'bold', textAlign: 'right', backgroundColor: '#E8E8E8' },
      { id: 'dm9', type: 'field', x: 0, y: 18, width: 30, height: 6, fieldPath: 'workOrderMaterial.item.code', fontSize: 8 },
      { id: 'dm10', type: 'field', x: 32, y: 18, width: 55, height: 6, fieldPath: 'workOrderMaterial.item.name', fontSize: 8 },
      { id: 'dm11', type: 'field', x: 89, y: 18, width: 18, height: 6, fieldPath: 'workOrderMaterial.quantity', fontSize: 8, textAlign: 'center' },
      { id: 'dm12', type: 'field', x: 109, y: 18, width: 22, height: 6, fieldPath: 'workOrderMaterial.itemUnit.name', fontSize: 8, textAlign: 'center' },
      { id: 'dm13', type: 'field', x: 133, y: 18, width: 28, height: 6, fieldPath: 'workOrderMaterial.unitPrice', fontSize: 8, textAlign: 'right' },
      { id: 'dm14', type: 'field', x: 163, y: 18, width: 23, height: 6, fieldPath: 'workOrderMaterial.amount', fontSize: 8, textAlign: 'right' },
    ];
    if (type === 'summary') return [
      { id: 's1', type: 'label', x: 0, y: 5, width: 40, height: 6, content: 'Keterangan', fontSize: 9, fontWeight: 'bold' },
      { id: 's2', type: 'field', x: 0, y: 12, width: 90, height: 12, fieldPath: 'workOrder.description', fontSize: 9 },
      { id: 's3', type: 'label', x: 100, y: 5, width: 45, height: 6, content: 'Total Bahan Baku :', fontSize: 9 },
      { id: 's4', type: 'field', x: 147, y: 5, width: 40, height: 6, fieldPath: 'workOrder.totalMaterial', fontSize: 9, textAlign: 'right' },
      { id: 's5', type: 'label', x: 100, y: 12, width: 45, height: 6, content: 'Total Biaya :', fontSize: 9 },
      { id: 's6', type: 'field', x: 147, y: 12, width: 40, height: 6, fieldPath: 'workOrder.totalExpense', fontSize: 9, textAlign: 'right' },
      { id: 's7', type: 'label', x: 100, y: 19, width: 45, height: 6, content: 'Total :', fontSize: 9, fontWeight: 'bold' },
      { id: 's8', type: 'field', x: 147, y: 19, width: 40, height: 6, fieldPath: 'workOrder.totalAmount', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
    ];
    return [];
  };

  const genId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const handleDrop = (e: React.DragEvent, bandId: string) => {
    e.preventDefault();
    if (!draggedField) return;
    const band = bands.find(b => b.id === bandId);
    if (!band) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, (e.clientX - rect.left) / scale / zoom);
    const y = (e.clientY - rect.top) / scale / zoom;
    const el: BandElement = { id: genId(), type: 'field', x, y, width: 50, height: 6, fieldPath: draggedField.path, fontSize: 9 };
    setBands(bands.map(b => b.id === bandId ? { ...b, elements: [...b.elements, el] } : b));
    setSelectedElement(el.id);
    setDraggedField(null);
  };

  const updateElement = (bandId: string, elId: string, updates: Partial<BandElement>) => {
    const newBands = bands.map(b => b.id === bandId ? { ...b, elements: b.elements.map(e => e.id === elId ? { ...e, ...updates } : e) } : b);
    setBands(newBands);
  };

  const deleteElement = (bandId: string, elId: string) => {
    setBands(bands.map(b => b.id === bandId ? { ...b, elements: b.elements.filter(e => e.id !== elId) } : b));
    setSelectedElement(null);
  };

  // Get selected element data - must be before functions that use it
  const getSelData = () => {
    for (const b of bands) {
      const el = b.elements.find(e => e.id === selectedElement);
      if (el) return { band: b, element: el };
    }
    return null;
  };
  const selData = getSelData();

  // History management for undo/redo
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(bands)));
    setHistory(newHistory.slice(-50)); // Keep last 50 states
    setHistoryIndex(newHistory.length - 1);
  }, [bands, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBands(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.success('Undo');
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBands(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.success('Redo');
    }
  }, [history, historyIndex]);

  // Copy element
  const copyElement = useCallback(() => {
    if (!selData) return;
    setClipboard({ ...selData.element });
    toast.success('Element copied (Ctrl+C)');
  }, [selData]);

  // Cut element
  const cutElement = useCallback(() => {
    if (!selData) return;
    saveToHistory();
    setClipboard({ ...selData.element });
    deleteElement(selData.band.id, selData.element.id);
    toast.success('Element cut (Ctrl+X)');
  }, [selData, saveToHistory]);

  // Paste element
  const pasteElement = useCallback(() => {
    if (!clipboard || !selectedBand) {
      toast.error('Nothing to paste or no band selected');
      return;
    }
    saveToHistory();
    const newEl: BandElement = {
      ...clipboard,
      id: genId(),
      x: clipboard.x + 5,
      y: clipboard.y + 5
    };
    setBands(bands.map(b => b.id === selectedBand ? { ...b, elements: [...b.elements, newEl] } : b));
    setSelectedElement(newEl.id);
    toast.success('Element pasted (Ctrl+V)');
  }, [clipboard, selectedBand, bands, saveToHistory]);

  // Duplicate element
  const duplicateElement = useCallback(() => {
    if (!selData) return;
    saveToHistory();
    const newEl: BandElement = {
      ...selData.element,
      id: genId(),
      x: selData.element.x + 5,
      y: selData.element.y + 3
    };
    setBands(bands.map(b => b.id === selData.band.id ? { ...b, elements: [...b.elements, newEl] } : b));
    setSelectedElement(newEl.id);
    toast.success('Element duplicated (Ctrl+D)');
  }, [selData, bands, saveToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            copyElement();
            break;
          case 'x':
            e.preventDefault();
            cutElement();
            break;
          case 'v':
            e.preventDefault();
            pasteElement();
            break;
          case 'd':
            e.preventDefault();
            duplicateElement();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'p':
            e.preventDefault();
            loadPreview();
            break;
        }
      }
      
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selData) {
          e.preventDefault();
          saveToHistory();
          deleteElement(selData.band.id, selData.element.id);
        }
      }

      // Arrow keys to move element
      if (selData && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        let { x, y } = selData.element;
        if (e.key === 'ArrowUp') y = Math.max(0, y - step);
        if (e.key === 'ArrowDown') y += step;
        if (e.key === 'ArrowLeft') x = Math.max(0, x - step);
        if (e.key === 'ArrowRight') x += step;
        updateElement(selData.band.id, selData.element.id, { x, y });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyElement, cutElement, pasteElement, duplicateElement, undo, redo, selData, saveToHistory]);

  // Drag to reposition handlers
  const handleMouseDown = (e: React.MouseEvent, bandId: string, elementId: string, handle?: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    const el = bands.find(b => b.id === bandId)?.elements.find(el => el.id === elementId);
    if (!el) return;
    saveToHistory();
    setDragState({
      type: handle ? 'resize' : 'move',
      bandId,
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      elX: el.x,
      elY: el.y,
      elWidth: el.width,
      elHeight: el.height,
      handle
    });
    setSelectedElement(elementId);
    setSelectedBand(bandId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;
    const dx = (e.clientX - dragState.startX) / scale / zoom;
    const dy = (e.clientY - dragState.startY) / scale / zoom;
    
    if (dragState.type === 'move') {
      const newX = snapValue(Math.max(0, dragState.elX + dx));
      const newY = snapValue(Math.max(0, dragState.elY + dy));
      updateElement(dragState.bandId, dragState.elementId, { x: newX, y: newY });
    } else if (dragState.type === 'resize' && dragState.handle) {
      let { elX, elY, elWidth, elHeight } = dragState;
      const minSize = 5;
      
      // Handle resize based on which handle is being dragged
      switch (dragState.handle) {
        case 'e':
          elWidth = snapValue(Math.max(minSize, elWidth + dx));
          break;
        case 'w':
          const newW = elWidth - dx;
          if (newW >= minSize) { elX = snapValue(elX + dx); elWidth = snapValue(newW); }
          break;
        case 's':
          elHeight = snapValue(Math.max(minSize, elHeight + dy));
          break;
        case 'n':
          const newH = elHeight - dy;
          if (newH >= minSize) { elY = snapValue(elY + dy); elHeight = snapValue(newH); }
          break;
        case 'se':
          elWidth = snapValue(Math.max(minSize, elWidth + dx));
          elHeight = snapValue(Math.max(minSize, elHeight + dy));
          break;
        case 'sw':
          const newWsw = elWidth - dx;
          if (newWsw >= minSize) { elX = snapValue(elX + dx); elWidth = snapValue(newWsw); }
          elHeight = snapValue(Math.max(minSize, elHeight + dy));
          break;
        case 'ne':
          elWidth = snapValue(Math.max(minSize, elWidth + dx));
          const newHne = elHeight - dy;
          if (newHne >= minSize) { elY = snapValue(elY + dy); elHeight = snapValue(newHne); }
          break;
        case 'nw':
          const newWnw = elWidth - dx;
          const newHnw = elHeight - dy;
          if (newWnw >= minSize) { elX = snapValue(elX + dx); elWidth = snapValue(newWnw); }
          if (newHnw >= minSize) { elY = snapValue(elY + dy); elHeight = snapValue(newHnw); }
          break;
      }
      updateElement(dragState.bandId, dragState.elementId, { x: elX, y: elY, width: elWidth, height: elHeight });
    }
  }, [dragState, scale, zoom, snapValue]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Layer controls
  const bringToFront = () => {
    if (!selData) return;
    saveToHistory();
    const maxZ = Math.max(...selData.band.elements.map(e => e.zIndex || 0));
    updateElement(selData.band.id, selData.element.id, { zIndex: maxZ + 1 });
  };

  const sendToBack = () => {
    if (!selData) return;
    saveToHistory();
    const minZ = Math.min(...selData.band.elements.map(e => e.zIndex || 0));
    updateElement(selData.band.id, selData.element.id, { zIndex: minZ - 1 });
  };

  // Load preview with sample data
  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      // Get sample data based on document type
      const res = await axiosInstance.get(`/api/documents/preview-data/${documentType}`);
      setPreviewData(res.data);
      setShowPreview(true);
    } catch (err) {
      // Use mock data if API not available
      setPreviewData(getMockData());
      setShowPreview(true);
    } finally {
      setLoadingPreview(false);
    }
  };

  const getMockData = () => ({
    company: { name: 'PT. CONTOH PERUSAHAAN', address: 'Jl. Contoh No. 123, Jakarta', phone: '021-1234567' },
    workOrder: { number: 'WO-2024-0001', transDate: '28/11/2024', item: { name: 'Produk A' }, quantity: 100, itemUnit: { name: 'Pcs' }, manufacturePlan: 'MP-001', description: 'Catatan contoh', totalMaterial: 'Rp 1.500.000', totalExpense: 'Rp 500.000', totalAmount: 'Rp 2.000.000' },
    workOrderMaterial: [
      { item: { code: 'MAT-001', name: 'Bahan Baku A' }, quantity: 50, itemUnit: { name: 'Kg' }, unitPrice: 'Rp 10.000', amount: 'Rp 500.000' },
      { item: { code: 'MAT-002', name: 'Bahan Baku B' }, quantity: 30, itemUnit: { name: 'Kg' }, unitPrice: 'Rp 15.000', amount: 'Rp 450.000' },
    ],
    workOrderExpense: [
      { item: { code: 'EXP-001', name: 'Biaya Listrik' }, quantity: 1, unitPrice: 'Rp 200.000', amount: 'Rp 200.000' },
    ]
  });

  // Render field value from data
  const renderFieldValue = (fieldPath: string, data: any): string => {
    if (!data) return `$F{${fieldPath}}`;
    const parts = fieldPath.split('.');
    let value = data;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return `$F{${fieldPath}}`;
      }
    }
    return String(value);
  };

  const handleSave = async () => {
    if (!templateName) { toast.error('Nama template harus diisi'); return; }
    setSaving(true);
    try {
      const payload = {
        template_name: templateName,
        template_code: `TPL-${Date.now().toString().slice(-6)}`,
        document_type: documentType,
        paper_size: paperSize,
        orientation, margins, is_active: true,
        template_structure: { version: '3.0', bands }
      };
      if (isEdit) await axiosInstance.put(`/api/documents/templates/${id}`, payload);
      else await axiosInstance.post('/api/documents/templates', payload);
      toast.success('Template saved');
      navigate('/app/documents/templates');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  // Export template to JSON
  const exportTemplate = () => {
    const templateData = {
      version: '3.0',
      templateName,
      documentType,
      paperSize,
      orientation,
      margins,
      bands,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName || 'template'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template exported!');
  };

  // Import template from JSON
  const importTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.version && data.bands) {
            saveToHistory();
            setTemplateName(data.templateName || templateName);
            setDocumentType(data.documentType || documentType);
            setPaperSize(data.paperSize || paperSize);
            setOrientation(data.orientation || orientation);
            setMargins(data.margins || margins);
            setBands(data.bands);
            toast.success('Template imported!');
          } else {
            toast.error('Invalid template file');
          }
        } catch {
          toast.error('Failed to parse template file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-800">
      {/* Toolbar */}
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/documents/templates')} className="p-2 hover:bg-gray-700 rounded" title="Back"><ArrowLeftIcon className="h-5 w-5" /></button>
          <span className="text-lg font-semibold">Template Designer</span>
        </div>
        
        {/* Center toolbar - Edit actions */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Undo (Ctrl+Z)">
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Redo (Ctrl+Y)">
            <ArrowUturnRightIcon className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-gray-600 mx-1" />
          <button onClick={copyElement} disabled={!selData} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Copy (Ctrl+C)">
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          <button onClick={pasteElement} disabled={!clipboard} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Paste (Ctrl+V)">
            <ClipboardIcon className="h-4 w-4" />
          </button>
          <button onClick={duplicateElement} disabled={!selData} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Duplicate (Ctrl+D)">
            <PlusIcon className="h-4 w-4" />
          </button>
          <button onClick={() => selData && deleteElement(selData.band.id, selData.element.id)} disabled={!selData} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40 text-red-400" title="Delete">
            <TrashIcon className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-gray-600 mx-1" />
          <button onClick={loadPreview} disabled={loadingPreview} className="p-1.5 hover:bg-gray-700 rounded" title="Preview (Ctrl+P)">
            {loadingPreview ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <EyeIcon className="h-4 w-4" />}
          </button>
          <div className="w-px h-5 bg-gray-600 mx-1" />
          <button onClick={bringToFront} disabled={!selData} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Bring to Front">
            <span className="text-xs font-bold">↑</span>
          </button>
          <button onClick={sendToBack} disabled={!selData} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40" title="Send to Back">
            <span className="text-xs font-bold">↓</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid & Snap toggles */}
          <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1 rounded text-xs ${showGrid ? 'bg-blue-600' : 'hover:bg-gray-700'}`} title="Toggle Grid">
              Grid
            </button>
            <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-1 rounded text-xs ${snapToGrid ? 'bg-blue-600' : 'hover:bg-gray-700'}`} title="Snap to Grid">
              Snap
            </button>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:bg-gray-700 rounded"><MagnifyingGlassMinusIcon className="h-4 w-4" /></button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:bg-gray-700 rounded"><MagnifyingGlassPlusIcon className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
            <button onClick={importTemplate} className="p-1.5 hover:bg-gray-700 rounded" title="Import Template">
              <ArrowUpTrayIcon className="h-4 w-4" />
            </button>
            <button onClick={exportTemplate} className="p-1.5 hover:bg-gray-700 rounded" title="Export Template">
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium flex items-center gap-2">
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />} Simpan (Ctrl+S)
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Fields */}
        <div className="w-60 bg-white border-r flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Nama Template" className="w-full px-3 py-2 border rounded text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-xs font-medium text-gray-600 mb-2 px-1">Drag field ke canvas</p>
            {Object.entries(fieldLibrary).map(([grp, fields]) => (
              <div key={grp} className="mb-1">
                <button onClick={() => setExpandedGroups(p => p.includes(grp) ? p.filter(g => g !== grp) : [...p, grp])} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
                  {expandedGroups.includes(grp) ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />} {grp}
                </button>
                {expandedGroups.includes(grp) && (
                  <div className="ml-4 space-y-0.5">
                    {fields.map(f => (
                      <div key={f.path} draggable onDragStart={() => setDraggedField(f)} className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded cursor-move border border-blue-200">
                        <span className="text-gray-700">{f.label}</span>
                        <span className="text-blue-500 ml-1 text-[10px]">${`{${f.path}}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas with Ruler */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Horizontal Ruler */}
          <div className="h-6 bg-gray-100 border-b flex-shrink-0 ml-6" style={{ width: canvasWidth * scale * zoom + 48 }}>
            <svg width="100%" height="100%" className="text-gray-400">
              {Array.from({ length: Math.ceil(canvasWidth / 10) + 1 }).map((_, i) => (
                <g key={i}>
                  <line x1={i * 10 * scale * zoom} y1={i % 5 === 0 ? 0 : 12} x2={i * 10 * scale * zoom} y2={24} stroke="currentColor" strokeWidth={i % 5 === 0 ? 1 : 0.5} />
                  {i % 5 === 0 && <text x={i * 10 * scale * zoom + 2} y={10} fontSize={8} fill="currentColor">{i * 10}</text>}
                </g>
              ))}
            </svg>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Vertical Ruler */}
            <div className="w-6 bg-gray-100 border-r flex-shrink-0">
              <svg width="100%" height="100%" className="text-gray-400">
                {Array.from({ length: 50 }).map((_, i) => (
                  <g key={i}>
                    <line x1={i % 5 === 0 ? 0 : 12} y1={i * 10 * scale * zoom} x2={24} y2={i * 10 * scale * zoom} stroke="currentColor" strokeWidth={i % 5 === 0 ? 1 : 0.5} />
                    {i % 5 === 0 && <text x={2} y={i * 10 * scale * zoom + 10} fontSize={8} fill="currentColor">{i * 10}</text>}
                  </g>
                ))}
              </svg>
            </div>
            
            {/* Canvas Area */}
            <div 
              ref={canvasRef}
              className="flex-1 overflow-auto bg-gray-600 p-6"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: dragState ? 'grabbing' : 'default' }}
            >
              <div className="bg-white shadow-xl mx-auto relative" style={{ width: canvasWidth * scale * zoom }}>
                {/* Grid overlay */}
                {showGrid && (
                  <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ opacity: 0.3 }}>
                    <defs>
                      <pattern id="grid" width={gridSize * scale * zoom} height={gridSize * scale * zoom} patternUnits="userSpaceOnUse">
                        <path d={`M ${gridSize * scale * zoom} 0 L 0 0 0 ${gridSize * scale * zoom}`} fill="none" stroke="#ccc" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                )}
                
                {bands.filter(b => b.visible).map(band => (
                  <div key={band.id} onClick={() => { setSelectedBand(band.id); setSelectedElement(null); }}
                    onDragOver={e => { e.preventDefault(); setSelectedBand(band.id); }} onDrop={e => handleDrop(e, band.id)}
                    className={`relative border-b border-dashed ${selectedBand === band.id ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300'}`}
                    style={{ height: band.height * scale * zoom, marginLeft: margins.left * scale * zoom, marginRight: margins.right * scale * zoom }}>
                    <div className={`absolute -left-2 top-0 text-[10px] px-1 py-0.5 rounded-sm transform -translate-x-full ${selectedBand === band.id ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'}`}>{band.label}</div>
                    {[...band.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => (
                      <div 
                        key={el.id} 
                        onMouseDown={e => handleMouseDown(e, band.id, el.id)}
                        onClick={e => { e.stopPropagation(); setSelectedElement(el.id); setSelectedBand(band.id); }}
                        className={`absolute select-none ${selectedElement === el.id ? 'ring-2 ring-blue-500' : ''} ${dragState?.elementId === el.id ? 'opacity-80' : ''}`}
                        style={{
                          left: el.x * scale * zoom, top: el.y * scale * zoom, width: el.width * scale * zoom, height: el.height * scale * zoom,
                          fontSize: (el.fontSize || 9) * zoom, fontWeight: el.fontWeight || 'normal', textAlign: el.textAlign || 'left',
                          color: el.color || '#000', backgroundColor: el.backgroundColor || 'transparent', zIndex: el.zIndex || 0,
                          border: el.type === 'box' ? `${el.borderWidth || 1}px solid ${el.borderColor || '#000'}` : el.type === 'line' ? 'none' : selectedElement === el.id ? '1px dashed #3B82F6' : '1px dashed transparent',
                          borderBottom: el.type === 'line' ? `${el.borderWidth || 1}px solid ${el.borderColor || '#000'}` : undefined,
                          display: 'flex', alignItems: 'center', padding: el.type !== 'line' ? '0 2px' : 0, overflow: 'hidden', whiteSpace: 'nowrap',
                          cursor: selectedElement === el.id ? 'move' : 'pointer'
                        }}>
                        {el.type === 'label' && el.content}
                        {el.type === 'field' && <span className="text-blue-600">${`{${el.fieldPath}}`}</span>}
                        {el.type === 'image' && el.imageSrc && <img src={el.imageSrc} alt="" className="w-full h-full object-contain" />}
                        
                        {/* Resize Handles */}
                        {selectedElement === el.id && (
                          <>
                            {(['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as ResizeHandle[]).map(handle => (
                              <div
                                key={handle}
                                onMouseDown={e => handleMouseDown(e, band.id, el.id, handle)}
                                className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
                                style={{
                                  cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' :
                                          handle === 'ne' || handle === 'sw' ? 'nesw-resize' :
                                          handle === 'n' || handle === 's' ? 'ns-resize' : 'ew-resize',
                                  top: handle.includes('n') ? -4 : handle.includes('s') ? 'calc(100% - 4px)' : 'calc(50% - 4px)',
                                  left: handle.includes('w') ? -4 : handle.includes('e') ? 'calc(100% - 4px)' : 'calc(50% - 4px)'
                                }}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Properties */}
        <div className="w-64 bg-white border-l flex flex-col">
          <div className="p-3 border-b bg-gray-50"><h3 className="font-semibold text-gray-800">Desain Cetakan</h3></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Paper</label>
              <select value={paperSize} onChange={e => setPaperSize(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm">
                {Object.entries(paperSizes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Margin (mm)</label>
              <div className="grid grid-cols-2 gap-2">
                {(['left', 'right', 'top', 'bottom'] as const).map(s => (
                  <div key={s}><label className="block text-xs text-gray-500 capitalize">{s}</label>
                    <input type="number" value={margins[s]} onChange={e => setMargins({ ...margins, [s]: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 border rounded text-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
              <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="w-full px-3 py-1.5 border rounded text-sm">
                <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe Dokumen</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm">
                <optgroup label="── Penjualan ──">
                  {documentTypes.filter(d => d.category === 'Penjualan').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label="── Pembelian ──">
                  {documentTypes.filter(d => d.category === 'Pembelian').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label="── Persediaan ──">
                  {documentTypes.filter(d => d.category === 'Persediaan').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label="── Produksi ──">
                  {documentTypes.filter(d => d.category === 'Produksi').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label="── Keuangan ──">
                  {documentTypes.filter(d => d.category === 'Keuangan').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label="── Pekerjaan ──">
                  {documentTypes.filter(d => d.category === 'Pekerjaan').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label="── HR ──">
                  {documentTypes.filter(d => d.category === 'HR').map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
              </select>
            </div>
            {selData && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3"><h4 className="font-medium text-gray-800">Properties</h4>
                  <button onClick={() => deleteElement(selData.band.id, selData.element.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="h-4 w-4" /></button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-gray-500">X</label><input type="number" value={Math.round(selData.element.x)} onChange={e => updateElement(selData.band.id, selData.element.id, { x: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border rounded text-sm" /></div>
                    <div><label className="block text-xs text-gray-500">Y</label><input type="number" value={Math.round(selData.element.y)} onChange={e => updateElement(selData.band.id, selData.element.id, { y: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border rounded text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-gray-500">Width</label><input type="number" value={Math.round(selData.element.width)} onChange={e => updateElement(selData.band.id, selData.element.id, { width: parseFloat(e.target.value) || 10 })} className="w-full px-2 py-1 border rounded text-sm" /></div>
                    <div><label className="block text-xs text-gray-500">Height</label><input type="number" value={Math.round(selData.element.height)} onChange={e => updateElement(selData.band.id, selData.element.id, { height: parseFloat(e.target.value) || 5 })} className="w-full px-2 py-1 border rounded text-sm" /></div>
                  </div>
                  {selData.element.type === 'label' && <div><label className="block text-xs text-gray-500">Content</label><input type="text" value={selData.element.content || ''} onChange={e => updateElement(selData.band.id, selData.element.id, { content: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></div>}
                  {selData.element.type === 'field' && <div><label className="block text-xs text-gray-500">Field</label><input type="text" value={selData.element.fieldPath || ''} onChange={e => updateElement(selData.band.id, selData.element.id, { fieldPath: e.target.value })} className="w-full px-2 py-1 border rounded text-sm font-mono text-blue-600" /></div>}
                  <div><label className="block text-xs text-gray-500">Font Size</label><input type="number" value={selData.element.fontSize || 9} onChange={e => updateElement(selData.band.id, selData.element.id, { fontSize: parseInt(e.target.value) || 9 })} className="w-full px-2 py-1 border rounded text-sm" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => updateElement(selData.band.id, selData.element.id, { fontWeight: selData.element.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 py-1 text-sm border rounded ${selData.element.fontWeight === 'bold' ? 'bg-gray-200' : ''}`}><strong>B</strong></button>
                    {(['left', 'center', 'right'] as const).map(a => <button key={a} onClick={() => updateElement(selData.band.id, selData.element.id, { textAlign: a })} className={`flex-1 py-1 text-xs border rounded capitalize ${selData.element.textAlign === a ? 'bg-gray-200' : ''}`}>{a[0].toUpperCase()}</button>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Preview Template</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    try {
                      const res = await axiosInstance.post('/api/documents/render-pdf', {
                        template_structure: { version: '3.0', bands },
                        document_data: previewData,
                        paper_size: paperSize,
                        orientation,
                        margins,
                        filename: `${templateName || 'document'}.pdf`
                      }, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${templateName || 'document'}.pdf`;
                      link.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('PDF downloaded!');
                    } catch (err) {
                      toast.error('Failed to generate PDF');
                    }
                  }} 
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" /> Download PDF
                </button>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-1 hover:bg-blue-700">
                  <PrinterIcon className="h-4 w-4" /> Print
                </button>
                <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-200 rounded">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-100">
              <div className="bg-white shadow-lg mx-auto" style={{ width: canvasWidth * scale, minHeight: 400 }}>
                {bands.filter(b => b.visible).map(band => (
                  <div key={band.id} className="relative" style={{ height: band.height * scale, marginLeft: margins.left * scale, marginRight: margins.right * scale }}>
                    {band.elements.map(el => (
                      <div key={el.id} className="absolute" style={{
                        left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale,
                        fontSize: el.fontSize || 9, fontWeight: el.fontWeight || 'normal', textAlign: el.textAlign || 'left',
                        color: el.color || '#000', backgroundColor: el.backgroundColor || 'transparent',
                        border: el.type === 'box' ? `${el.borderWidth || 1}px solid ${el.borderColor || '#000'}` : 'none',
                        borderBottom: el.type === 'line' ? `${el.borderWidth || 1}px solid ${el.borderColor || '#000'}` : undefined,
                        display: 'flex', alignItems: 'center', padding: el.type !== 'line' ? '0 2px' : 0, overflow: 'hidden', whiteSpace: 'nowrap'
                      }}>
                        {el.type === 'label' && el.content}
                        {el.type === 'field' && el.fieldPath && (
                          <span>{renderFieldValue(el.fieldPath, previewData)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
              <strong>Keyboard Shortcuts:</strong> Ctrl+C (Copy) | Ctrl+V (Paste) | Ctrl+D (Duplicate) | Ctrl+Z (Undo) | Ctrl+Y (Redo) | Ctrl+S (Save) | Delete (Remove) | Arrow Keys (Move)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
