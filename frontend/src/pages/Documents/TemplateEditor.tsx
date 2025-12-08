import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  Bars3Icon,
  PhotoIcon,
  TableCellsIcon,
  DocumentTextIcon,
  QueueListIcon,
  ArrowsPointingOutIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Square2StackIcon,
  PencilIcon,
  XMarkIcon,
  PrinterIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Available fields for each document type
const availableFields: Record<string, Array<{ id: string; label: string; category: string }>> = {
  surat_jalan: [
    { id: 'document_number', label: 'No. Surat Jalan', category: 'Document' },
    { id: 'document_date', label: 'Tanggal', category: 'Document' },
    { id: 'customer_name', label: 'Nama Customer', category: 'Customer' },
    { id: 'customer_address', label: 'Alamat Customer', category: 'Customer' },
    { id: 'customer_phone', label: 'Telepon Customer', category: 'Customer' },
    { id: 'sales_order_number', label: 'No. Sales Order', category: 'Reference' },
    { id: 'delivery_address', label: 'Alamat Pengiriman', category: 'Delivery' },
    { id: 'driver_name', label: 'Nama Driver', category: 'Delivery' },
    { id: 'vehicle_number', label: 'No. Kendaraan', category: 'Delivery' },
    { id: 'items', label: 'Daftar Barang', category: 'Items' },
    { id: 'item_no', label: 'No.', category: 'Item Detail' },
    { id: 'item_code', label: 'Kode Barang', category: 'Item Detail' },
    { id: 'item_name', label: 'Nama Barang', category: 'Item Detail' },
    { id: 'item_qty', label: 'Qty', category: 'Item Detail' },
    { id: 'item_unit', label: 'Satuan', category: 'Item Detail' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
    { id: 'prepared_by', label: 'Dibuat Oleh', category: 'Signature' },
    { id: 'approved_by', label: 'Disetujui Oleh', category: 'Signature' },
    { id: 'received_by', label: 'Diterima Oleh', category: 'Signature' },
  ],
  invoice: [
    { id: 'invoice_number', label: 'No. Invoice', category: 'Document' },
    { id: 'invoice_date', label: 'Tanggal Invoice', category: 'Document' },
    { id: 'due_date', label: 'Jatuh Tempo', category: 'Document' },
    { id: 'customer_name', label: 'Nama Customer', category: 'Customer' },
    { id: 'customer_address', label: 'Alamat Customer', category: 'Customer' },
    { id: 'customer_npwp', label: 'NPWP Customer', category: 'Customer' },
    { id: 'sales_order_number', label: 'No. Sales Order', category: 'Reference' },
    { id: 'po_number', label: 'No. PO Customer', category: 'Reference' },
    { id: 'items', label: 'Daftar Item', category: 'Items' },
    { id: 'item_no', label: 'No.', category: 'Item Detail' },
    { id: 'item_code', label: 'Kode', category: 'Item Detail' },
    { id: 'item_name', label: 'Deskripsi', category: 'Item Detail' },
    { id: 'item_qty', label: 'Qty', category: 'Item Detail' },
    { id: 'item_unit', label: 'Satuan', category: 'Item Detail' },
    { id: 'item_price', label: 'Harga', category: 'Item Detail' },
    { id: 'item_discount', label: 'Diskon', category: 'Item Detail' },
    { id: 'item_total', label: 'Jumlah', category: 'Item Detail' },
    { id: 'subtotal', label: 'Subtotal', category: 'Summary' },
    { id: 'discount', label: 'Diskon', category: 'Summary' },
    { id: 'tax', label: 'PPN', category: 'Summary' },
    { id: 'total', label: 'Total', category: 'Summary' },
    { id: 'terbilang', label: 'Terbilang', category: 'Summary' },
    { id: 'bank_name', label: 'Nama Bank', category: 'Payment' },
    { id: 'bank_account', label: 'No. Rekening', category: 'Payment' },
    { id: 'bank_holder', label: 'Atas Nama', category: 'Payment' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ],
  spk: [
    { id: 'spk_number', label: 'No. SPK', category: 'Document' },
    { id: 'spk_date', label: 'Tanggal SPK', category: 'Document' },
    { id: 'work_order_number', label: 'No. Work Order', category: 'Reference' },
    { id: 'product_name', label: 'Nama Produk', category: 'Product' },
    { id: 'product_code', label: 'Kode Produk', category: 'Product' },
    { id: 'quantity', label: 'Jumlah', category: 'Product' },
    { id: 'unit', label: 'Satuan', category: 'Product' },
    { id: 'start_date', label: 'Tanggal Mulai', category: 'Schedule' },
    { id: 'end_date', label: 'Tanggal Selesai', category: 'Schedule' },
    { id: 'machine', label: 'Mesin', category: 'Production' },
    { id: 'operator', label: 'Operator', category: 'Production' },
    { id: 'materials', label: 'Daftar Material', category: 'Materials' },
    { id: 'instructions', label: 'Instruksi Kerja', category: 'Other' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ],
  quotation: [
    { id: 'quotation_number', label: 'No. Penawaran', category: 'Document' },
    { id: 'quotation_date', label: 'Tanggal', category: 'Document' },
    { id: 'valid_until', label: 'Berlaku Sampai', category: 'Document' },
    { id: 'customer_name', label: 'Nama Customer', category: 'Customer' },
    { id: 'customer_address', label: 'Alamat', category: 'Customer' },
    { id: 'customer_phone', label: 'Telepon', category: 'Customer' },
    { id: 'customer_email', label: 'Email', category: 'Customer' },
    { id: 'attention', label: 'Attention', category: 'Customer' },
    { id: 'items', label: 'Daftar Item', category: 'Items' },
    { id: 'subtotal', label: 'Subtotal', category: 'Summary' },
    { id: 'discount', label: 'Diskon', category: 'Summary' },
    { id: 'tax', label: 'PPN', category: 'Summary' },
    { id: 'total', label: 'Total', category: 'Summary' },
    { id: 'terms', label: 'Syarat & Ketentuan', category: 'Other' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ],
  purchase_order: [
    { id: 'po_number', label: 'No. PO', category: 'Document' },
    { id: 'po_date', label: 'Tanggal PO', category: 'Document' },
    { id: 'supplier_name', label: 'Nama Supplier', category: 'Supplier' },
    { id: 'supplier_address', label: 'Alamat Supplier', category: 'Supplier' },
    { id: 'supplier_phone', label: 'Telepon', category: 'Supplier' },
    { id: 'delivery_date', label: 'Tanggal Kirim', category: 'Delivery' },
    { id: 'delivery_address', label: 'Alamat Kirim', category: 'Delivery' },
    { id: 'items', label: 'Daftar Item', category: 'Items' },
    { id: 'subtotal', label: 'Subtotal', category: 'Summary' },
    { id: 'tax', label: 'PPN', category: 'Summary' },
    { id: 'total', label: 'Total', category: 'Summary' },
    { id: 'payment_terms', label: 'Syarat Pembayaran', category: 'Other' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ],
  delivery_note: [
    { id: 'dn_number', label: 'No. Delivery Note', category: 'Document' },
    { id: 'dn_date', label: 'Tanggal', category: 'Document' },
    { id: 'customer_name', label: 'Nama Customer', category: 'Customer' },
    { id: 'delivery_address', label: 'Alamat Pengiriman', category: 'Delivery' },
    { id: 'items', label: 'Daftar Barang', category: 'Items' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ],
  work_order: [
    { id: 'wo_number', label: 'No. Work Order', category: 'Document' },
    { id: 'wo_date', label: 'Tanggal', category: 'Document' },
    { id: 'product_name', label: 'Nama Produk', category: 'Product' },
    { id: 'quantity', label: 'Jumlah', category: 'Product' },
    { id: 'due_date', label: 'Deadline', category: 'Schedule' },
    { id: 'operations', label: 'Daftar Operasi', category: 'Operations' },
    { id: 'materials', label: 'Daftar Material', category: 'Materials' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ],
  receipt: [
    { id: 'receipt_number', label: 'No. Kwitansi', category: 'Document' },
    { id: 'receipt_date', label: 'Tanggal', category: 'Document' },
    { id: 'received_from', label: 'Diterima Dari', category: 'Payer' },
    { id: 'amount', label: 'Jumlah', category: 'Payment' },
    { id: 'terbilang', label: 'Terbilang', category: 'Payment' },
    { id: 'payment_for', label: 'Untuk Pembayaran', category: 'Payment' },
    { id: 'payment_method', label: 'Metode Pembayaran', category: 'Payment' },
    { id: 'notes', label: 'Catatan', category: 'Other' },
  ]
};

interface TemplateElement {
  id: string;
  type: 'text' | 'field' | 'image' | 'table' | 'line' | 'box' | 'signature';
  content?: string;
  fieldId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  color?: string;
  columns?: Array<{ id: string; label: string; width: number }>;
}

const documentTypes = [
  { value: 'surat_jalan', label: 'Surat Jalan' },
  { value: 'spk', label: 'Surat Perintah Kerja' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'delivery_note', label: 'Delivery Note' },
  { value: 'work_order', label: 'Work Order' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'receipt', label: 'Receipt' }
];

const paperSizes: Record<string, { width: number; height: number }> = {
  'A4': { width: 210, height: 297 },
  'A5': { width: 148, height: 210 },
  'Letter': { width: 216, height: 279 },
  'Legal': { width: 216, height: 356 }
};

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'settings' | 'preview'>('design');
  const [showFieldPanel, setShowFieldPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);

  // Template settings
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [documentType, setDocumentType] = useState('surat_jalan');
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margins, setMargins] = useState({ top: 15, right: 15, bottom: 15, left: 15 });
  const [isDefault, setIsDefault] = useState(false);

  // Canvas elements
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Get canvas dimensions based on paper size and orientation
  const getCanvasDimensions = () => {
    const size = paperSizes[paperSize] || paperSizes['A4'];
    if (orientation === 'landscape') {
      return { width: size.height, height: size.width };
    }
    return size;
  };

  const canvasDimensions = getCanvasDimensions();
  const scale = 2.5; // mm to px conversion

  useEffect(() => {
    if (isEdit) {
      loadTemplate();
    } else {
      // Add default elements for new template
      addDefaultElements();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/documents/templates/${id}`);
      const template = response.data.template;
      
      setTemplateName(template.template_name || '');
      setTemplateCode(template.template_code || '');
      setDocumentType(template.document_type || 'surat_jalan');
      setPaperSize(template.paper_size || 'A4');
      setOrientation(template.orientation || 'portrait');
      setMargins(template.margins || { top: 15, right: 15, bottom: 15, left: 15 });
      setIsDefault(template.is_default || false);
      
      // Load elements from template structure
      if (template.template_structure?.elements) {
        setElements(template.template_structure.elements);
      } else {
        addDefaultElements();
      }
    } catch (error) {
      toast.error('Failed to load template');
      navigate('/app/documents/templates');
    } finally {
      setLoading(false);
    }
  };

  const addDefaultElements = () => {
    const defaultElements: TemplateElement[] = [
      {
        id: 'header-title',
        type: 'text',
        content: 'NAMA PERUSAHAAN',
        x: 15,
        y: 15,
        width: 180,
        height: 10,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'header-address',
        type: 'text',
        content: 'Alamat Perusahaan, Kota, Kode Pos',
        x: 15,
        y: 26,
        width: 180,
        height: 6,
        fontSize: 10,
        textAlign: 'center'
      },
      {
        id: 'header-line',
        type: 'line',
        x: 15,
        y: 35,
        width: 180,
        height: 1,
        borderWidth: 2,
        borderColor: '#000000'
      },
      {
        id: 'doc-title',
        type: 'text',
        content: 'SURAT JALAN',
        x: 15,
        y: 42,
        width: 180,
        height: 10,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center'
      }
    ];
    setElements(defaultElements);
  };

  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale / zoom;
    const y = (e.clientY - rect.top) / scale / zoom;

    const fields = availableFields[documentType] || [];
    const field = fields.find(f => f.id === draggedField);

    if (field) {
      const newElement: TemplateElement = {
        id: generateId(),
        type: 'field',
        fieldId: field.id,
        content: `{${field.id}}`,
        x: Math.max(margins.left, Math.min(x, canvasDimensions.width - margins.right - 40)),
        y: Math.max(margins.top, Math.min(y, canvasDimensions.height - margins.bottom - 8)),
        width: 50,
        height: 8,
        fontSize: 10,
        textAlign: 'left'
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    }

    setDraggedField(null);
  };

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: generateId(),
      type,
      x: margins.left + 10,
      y: margins.top + 50,
      width: type === 'table' ? 180 : type === 'line' ? 100 : 60,
      height: type === 'table' ? 50 : type === 'line' ? 1 : type === 'signature' ? 30 : 8,
      fontSize: 10,
      textAlign: 'left',
      content: type === 'text' ? 'Text' : type === 'signature' ? 'Tanda Tangan' : undefined,
      borderWidth: type === 'box' || type === 'table' ? 1 : 0,
      borderColor: '#000000',
      columns: type === 'table' ? [
        { id: 'no', label: 'No', width: 10 },
        { id: 'item', label: 'Item', width: 60 },
        { id: 'qty', label: 'Qty', width: 15 },
        { id: 'unit', label: 'Satuan', width: 15 }
      ] : undefined
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: generateId(),
        x: element.x + 5,
        y: element.y + 5
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    }
  };

  const moveElement = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;
    
    const newElements = [...elements];
    if (direction === 'up' && index > 0) {
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    } else if (direction === 'down' && index < elements.length - 1) {
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    }
    setElements(newElements);
  };

  const handleSave = async () => {
    if (!templateName) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        template_name: templateName,
        template_code: templateCode || `TPL-${documentType.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-4)}`,
        document_type: documentType,
        paper_size: paperSize,
        orientation,
        margins,
        is_default: isDefault,
        is_active: true,
        template_structure: {
          elements,
          version: '2.0'
        }
      };

      if (isEdit) {
        await axiosInstance.put(`/api/documents/templates/${id}`, payload);
        toast.success('Template updated');
      } else {
        await axiosInstance.post('/api/documents/templates', payload);
        toast.success('Template created');
      }
      
      navigate('/app/documents/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);
  const fields = availableFields[documentType] || [];
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof fields>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/documents/templates')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
              className="text-lg font-semibold border-0 border-b-2 border-transparent focus:border-indigo-500 focus:ring-0 bg-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'design' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PencilIcon className="h-4 w-4 inline mr-1" />
            Design
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cog6ToothIcon className="h-4 w-4 inline mr-1" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <EyeIcon className="h-4 w-4 inline mr-1" />
            Preview
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            -
          </button>
          <span className="text-sm text-gray-600 w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            +
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4 mr-1" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Fields */}
        {activeTab === 'design' && showFieldPanel && (
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Fields</h3>
              <button onClick={() => setShowFieldPanel(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Add Elements */}
            <div className="p-3 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Add Element</p>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => addElement('text')}
                  className="p-2 hover:bg-gray-100 rounded text-gray-600"
                  title="Text"
                >
                  <DocumentTextIcon className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => addElement('table')}
                  className="p-2 hover:bg-gray-100 rounded text-gray-600"
                  title="Table"
                >
                  <TableCellsIcon className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => addElement('line')}
                  className="p-2 hover:bg-gray-100 rounded text-gray-600"
                  title="Line"
                >
                  <Bars3Icon className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => addElement('box')}
                  className="p-2 hover:bg-gray-100 rounded text-gray-600"
                  title="Box"
                >
                  <Square2StackIcon className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => addElement('image')}
                  className="p-2 hover:bg-gray-100 rounded text-gray-600"
                  title="Image"
                >
                  <PhotoIcon className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => addElement('signature')}
                  className="p-2 hover:bg-gray-100 rounded text-gray-600"
                  title="Signature"
                >
                  <PencilIcon className="h-5 w-5 mx-auto" />
                </button>
              </div>
            </div>

            {/* Available Fields */}
            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-xs text-gray-500 mb-2">Drag fields to canvas</p>
              {Object.entries(groupedFields).map(([category, categoryFields]) => (
                <div key={category} className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">{category}</p>
                  <div className="space-y-1">
                    {categoryFields.map((field) => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(field.id)}
                        className="px-2 py-1.5 bg-gray-50 hover:bg-indigo-50 rounded text-sm cursor-move border border-gray-200 hover:border-indigo-300 transition-colors"
                      >
                        <span className="text-gray-600">{field.label}</span>
                        <span className="text-xs text-gray-400 ml-1">({field.id})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-200">
          {activeTab === 'design' && (
            <div
              ref={canvasRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="bg-white shadow-lg mx-auto relative"
              style={{
                width: canvasDimensions.width * scale * zoom,
                height: canvasDimensions.height * scale * zoom,
                transform: `scale(1)`,
                transformOrigin: 'top left'
              }}
            >
              {/* Margin guides */}
              <div
                className="absolute border border-dashed border-blue-300 pointer-events-none"
                style={{
                  left: margins.left * scale * zoom,
                  top: margins.top * scale * zoom,
                  right: margins.right * scale * zoom,
                  bottom: margins.bottom * scale * zoom,
                  width: `calc(100% - ${(margins.left + margins.right) * scale * zoom}px)`,
                  height: `calc(100% - ${(margins.top + margins.bottom) * scale * zoom}px)`
                }}
              />

              {/* Elements */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element.id)}
                  className={`absolute cursor-pointer ${
                    selectedElement === element.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  style={{
                    left: element.x * scale * zoom,
                    top: element.y * scale * zoom,
                    width: element.width * scale * zoom,
                    height: element.height * scale * zoom,
                    fontSize: (element.fontSize || 10) * zoom,
                    fontWeight: element.fontWeight || 'normal',
                    fontStyle: element.fontStyle || 'normal',
                    textAlign: element.textAlign || 'left',
                    backgroundColor: element.backgroundColor || 'transparent',
                    color: element.color || '#000000',
                    border: element.type === 'line' 
                      ? 'none' 
                      : element.borderWidth 
                        ? `${element.borderWidth}px solid ${element.borderColor || '#000'}` 
                        : selectedElement === element.id ? '1px dashed #6366f1' : '1px dashed transparent',
                    borderBottom: element.type === 'line' 
                      ? `${element.borderWidth || 1}px solid ${element.borderColor || '#000'}` 
                      : undefined,
                    display: 'flex',
                    alignItems: element.type === 'signature' ? 'flex-end' : 'center',
                    justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    padding: element.type !== 'line' ? '2px 4px' : 0,
                    overflow: 'hidden'
                  }}
                >
                  {element.type === 'text' && element.content}
                  {element.type === 'field' && (
                    <span className="text-indigo-600 bg-indigo-50 px-1 rounded text-xs">
                      {element.content}
                    </span>
                  )}
                  {element.type === 'table' && (
                    <div className="w-full h-full flex flex-col text-xs">
                      <div className="flex border-b border-gray-400 bg-gray-100 font-medium">
                        {element.columns?.map((col) => (
                          <div key={col.id} className="px-1 py-0.5 border-r border-gray-300" style={{ width: `${col.width}%` }}>
                            {col.label}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        [Table Data]
                      </div>
                    </div>
                  )}
                  {element.type === 'signature' && (
                    <div className="w-full text-center border-t border-gray-400 pt-1">
                      <span className="text-xs">{element.content}</span>
                    </div>
                  )}
                  {element.type === 'image' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <PhotoIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Template Settings</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Code</label>
                  <input
                    type="text"
                    value={templateCode}
                    onChange={(e) => setTemplateCode(e.target.value)}
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(paperSizes).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Set as default template</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Margins (mm)</label>
                <div className="grid grid-cols-4 gap-4">
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <div key={side}>
                      <label className="block text-xs text-gray-500 mb-1 capitalize">{side}</label>
                      <input
                        type="number"
                        value={margins[side]}
                        onChange={(e) => setMargins({ ...margins, [side]: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={50}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div
              className="bg-white shadow-lg mx-auto p-8"
              style={{
                width: canvasDimensions.width * scale,
                minHeight: canvasDimensions.height * scale
              }}
            >
              <div className="text-center text-gray-500">
                <PrinterIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Preview will show sample data</p>
                <p className="text-sm mt-2">Save template first to generate preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        {activeTab === 'design' && showPropertiesPanel && selectedEl && (
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Properties</h3>
              <button onClick={() => setShowPropertiesPanel(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Element Actions */}
              <div className="flex items-center gap-1 pb-3 border-b border-gray-200">
                <button
                  onClick={() => duplicateElement(selectedEl.id)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  title="Duplicate"
                >
                  <Square2StackIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveElement(selectedEl.id, 'up')}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  title="Move Up"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveElement(selectedEl.id, 'down')}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  title="Move Down"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteElement(selectedEl.id)}
                  className="p-1.5 hover:bg-red-100 rounded text-red-600 ml-auto"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Position */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Position (mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.x)}
                      onChange={(e) => updateElement(selectedEl.id, { x: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.y)}
                      onChange={(e) => updateElement(selectedEl.id, { y: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Size (mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.width)}
                      onChange={(e) => updateElement(selectedEl.id, { width: parseFloat(e.target.value) || 10 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.height)}
                      onChange={(e) => updateElement(selectedEl.id, { height: parseFloat(e.target.value) || 5 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Content (for text elements) */}
              {(selectedEl.type === 'text' || selectedEl.type === 'signature') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={selectedEl.content || ''}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}

              {/* Font Settings */}
              {selectedEl.type !== 'line' && selectedEl.type !== 'image' && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Font</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500">Size</label>
                      <input
                        type="number"
                        value={selectedEl.fontSize || 10}
                        onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) || 10 })}
                        min={6}
                        max={72}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateElement(selectedEl.id, { 
                          fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' 
                        })}
                        className={`px-3 py-1 text-sm border rounded ${
                          selectedEl.fontWeight === 'bold' ? 'bg-gray-200 border-gray-400' : 'border-gray-300'
                        }`}
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        onClick={() => updateElement(selectedEl.id, { 
                          fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' 
                        })}
                        className={`px-3 py-1 text-sm border rounded ${
                          selectedEl.fontStyle === 'italic' ? 'bg-gray-200 border-gray-400' : 'border-gray-300'
                        }`}
                      >
                        <em>I</em>
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Align</label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => updateElement(selectedEl.id, { textAlign: align })}
                            className={`flex-1 px-2 py-1 text-xs border rounded capitalize ${
                              selectedEl.textAlign === align ? 'bg-gray-200 border-gray-400' : 'border-gray-300'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Border (for line and box) */}
              {(selectedEl.type === 'line' || selectedEl.type === 'box' || selectedEl.type === 'table') && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Border</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Width</label>
                      <input
                        type="number"
                        value={selectedEl.borderWidth || 1}
                        onChange={(e) => updateElement(selectedEl.id, { borderWidth: parseInt(e.target.value) || 1 })}
                        min={1}
                        max={10}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Color</label>
                      <input
                        type="color"
                        value={selectedEl.borderColor || '#000000'}
                        onChange={(e) => updateElement(selectedEl.id, { borderColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Colors */}
              {selectedEl.type !== 'line' && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Colors</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Text</label>
                      <input
                        type="color"
                        value={selectedEl.color || '#000000'}
                        onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Background</label>
                      <input
                        type="color"
                        value={selectedEl.backgroundColor || '#ffffff'}
                        onChange={(e) => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle panels buttons */}
        {activeTab === 'design' && (
          <>
            {!showFieldPanel && (
              <button
                onClick={() => setShowFieldPanel(true)}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-r-lg p-2 shadow-sm"
              >
                <QueueListIcon className="h-5 w-5 text-gray-600" />
              </button>
            )}
            {!showPropertiesPanel && (
              <button
                onClick={() => setShowPropertiesPanel(true)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-l-lg p-2 shadow-sm"
              >
                <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
