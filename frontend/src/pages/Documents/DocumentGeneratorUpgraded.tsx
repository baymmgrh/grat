import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface Template {
  id: number;
  template_name: string;
  template_code: string;
  document_type: string;
  paper_size: string;
  orientation: string;
  is_default: boolean;
}

interface ReferenceItem {
  id: number;
  number: string;
  title: string;
  date: string;
  status: string;
  customer?: string;
  total?: number;
}

const documentTypes = [
  { 
    value: 'surat_jalan', 
    label: 'Surat Jalan', 
    icon: '📦',
    description: 'Delivery document for shipped goods',
    referenceType: 'sales_order',
    referenceLabel: 'Sales Order',
    color: 'blue'
  },
  { 
    value: 'spk', 
    label: 'Surat Perintah Kerja', 
    icon: '🔧',
    description: 'Work instruction for production',
    referenceType: 'work_order',
    referenceLabel: 'Work Order',
    color: 'orange'
  },
  { 
    value: 'invoice', 
    label: 'Invoice', 
    icon: '💰',
    description: 'Billing document for customers',
    referenceType: 'sales_order',
    referenceLabel: 'Sales Order',
    color: 'green'
  },
  { 
    value: 'purchase_order', 
    label: 'Purchase Order', 
    icon: '🛒',
    description: 'Order document for suppliers',
    referenceType: 'purchase_order',
    referenceLabel: 'Purchase Order',
    color: 'purple'
  },
  { 
    value: 'delivery_note', 
    label: 'Delivery Note', 
    icon: '🚚',
    description: 'Shipping confirmation document',
    referenceType: 'shipping_order',
    referenceLabel: 'Shipping Order',
    color: 'teal'
  },
  { 
    value: 'work_order', 
    label: 'Work Order Document', 
    icon: '⚙️',
    description: 'Production work order details',
    referenceType: 'work_order',
    referenceLabel: 'Work Order',
    color: 'yellow'
  },
  { 
    value: 'quotation', 
    label: 'Quotation', 
    icon: '📋',
    description: 'Price quotation for customers',
    referenceType: 'quotation',
    referenceLabel: 'Quotation',
    color: 'indigo'
  }
];

export default function DocumentGeneratorUpgraded() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedType = searchParams.get('type');

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>(preselectedType || '');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [selectedReference, setSelectedReference] = useState<ReferenceItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const selectedTypeConfig = documentTypes.find(t => t.value === selectedType);

  useEffect(() => {
    if (preselectedType) {
      setSelectedType(preselectedType);
      loadTemplates(preselectedType);
    }
  }, [preselectedType]);

  useEffect(() => {
    if (selectedType) {
      loadTemplates(selectedType);
      loadReferences();
    }
  }, [selectedType]);

  const loadTemplates = async (type: string) => {
    try {
      const response = await axiosInstance.get('/api/documents/templates', {
        params: { document_type: type }
      });
      const templateList = response.data.templates || [];
      setTemplates(templateList);
      
      // Auto-select default template
      const defaultTemplate = templateList.find((t: Template) => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      } else if (templateList.length > 0) {
        setSelectedTemplate(templateList[0].id);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadReferences = async () => {
    if (!selectedTypeConfig) return;
    
    setLoading(true);
    try {
      let endpoint = '';
      switch (selectedTypeConfig.referenceType) {
        case 'sales_order':
          endpoint = '/api/sales/orders';
          break;
        case 'work_order':
          endpoint = '/api/production/work-orders';
          break;
        case 'purchase_order':
          endpoint = '/api/purchasing/purchase-orders';
          break;
        case 'shipping_order':
          endpoint = '/api/shipping/orders';
          break;
        case 'quotation':
          endpoint = '/api/sales/quotations';
          break;
        default:
          return;
      }
      
      const response = await axiosInstance.get(endpoint);
      const data = response.data;
      
      // Normalize data structure
      let items: ReferenceItem[] = [];
      if (data.orders) {
        items = data.orders.map((o: any) => ({
          id: o.id,
          number: o.order_number || o.wo_number || o.po_number || o.quotation_number,
          title: o.customer_name || o.product_name || o.supplier_name || '',
          date: o.order_date || o.created_at,
          status: o.status,
          customer: o.customer_name,
          total: o.total_amount
        }));
      } else if (data.work_orders) {
        items = data.work_orders.map((wo: any) => ({
          id: wo.id,
          number: wo.wo_number,
          title: wo.product_name || '',
          date: wo.created_at,
          status: wo.status
        }));
      } else if (data.quotations) {
        items = data.quotations.map((q: any) => ({
          id: q.id,
          number: q.quotation_number,
          title: q.customer_name || '',
          date: q.quotation_date,
          status: q.status,
          total: q.total_amount
        }));
      }
      
      setReferences(items);
    } catch (error) {
      console.error('Error loading references:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferences = references.filter(ref => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ref.number.toLowerCase().includes(term) ||
      ref.title?.toLowerCase().includes(term) ||
      ref.customer?.toLowerCase().includes(term)
    );
  });

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    setGenerating(true);
    try {
      const payload: any = {
        template_id: selectedTemplate,
        document_title: documentTitle || `${selectedTypeConfig?.label} - ${selectedReference?.number || 'Manual'}`,
        document_date: documentDate,
        document_data: {
          notes: notes
        }
      };

      if (selectedReference) {
        payload.reference_type = selectedTypeConfig?.referenceType;
        payload.reference_id = selectedReference.id;
        payload.reference_number = selectedReference.number;
      }

      const response = await axiosInstance.post('/api/documents/generate', payload);
      
      toast.success('Document generated successfully!');
      
      // Navigate to document preview or list
      if (response.data.document_id) {
        navigate(`/app/documents`);
      } else {
        navigate('/app/documents');
      }
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error(error.response?.data?.error || 'Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Step 1: Select Document Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              setSelectedType(type.value);
              setStep(2);
            }}
            className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md ${
              selectedType === type.value
                ? `border-${type.color}-500 bg-${type.color}-50 shadow-md`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-3xl block mb-3">{type.icon}</span>
            <h3 className="font-semibold text-gray-900">{type.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{type.description}</p>
            <p className="text-xs text-gray-400 mt-2">
              Reference: {type.referenceLabel}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Step 2: Select {selectedTypeConfig?.referenceLabel} (Optional)
        </h2>
        <button
          onClick={() => setStep(3)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Skip - Create Manual Document →
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${selectedTypeConfig?.referenceLabel}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Reference List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredReferences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No {selectedTypeConfig?.referenceLabel} found</p>
          <button
            onClick={() => setStep(3)}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Create manual document instead
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredReferences.map((ref) => (
            <button
              key={ref.id}
              onClick={() => {
                setSelectedReference(ref);
                setStep(3);
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                selectedReference?.id === ref.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{ref.number}</p>
                  <p className="text-sm text-gray-600 mt-1">{ref.title || ref.customer}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ref.status === 'confirmed' || ref.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : ref.status === 'draft'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {ref.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>{new Date(ref.date).toLocaleDateString('id-ID')}</span>
                {ref.total && (
                  <span className="font-medium text-gray-600">
                    Rp {ref.total.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Step 3: Configure Document</h2>

      {/* Selected Reference Info */}
      {selectedReference && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-600 font-medium mb-1">Reference Document</p>
          <p className="font-semibold text-indigo-900">{selectedReference.number}</p>
          <p className="text-sm text-indigo-700">{selectedReference.title || selectedReference.customer}</p>
        </div>
      )}

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        {templates.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 text-sm">
              No templates available for {selectedTypeConfig?.label}. 
              <button
                onClick={() => navigate('/app/documents/templates/new')}
                className="ml-1 text-yellow-800 underline"
              >
                Create one
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <DocumentDuplicateIcon className="h-6 w-6 text-indigo-600" />
                  {template.is_default && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-medium text-gray-900">{template.template_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {template.paper_size} • {template.orientation}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Document Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Title (Optional)
          </label>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder={`${selectedTypeConfig?.label} - ${selectedReference?.number || 'Manual'}`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Date
          </label>
          <input
            type="date"
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional notes for this document..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleGenerate}
          disabled={!selectedTemplate || generating}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Generate Document
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                navigate('/app/documents');
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8" />
              Generate Document
            </h1>
            <p className="text-indigo-100 mt-1">Create new document from template</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Document Type' },
            { num: 2, label: 'Select Reference' },
            { num: 3, label: 'Configure & Generate' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => s.num < step && setStep(s.num)}
                className={`flex items-center gap-3 ${s.num <= step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step === s.num
                    ? 'bg-indigo-600 text-white'
                    : step > s.num
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    s.num
                  )}
                </div>
                <span className={`font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </button>
              {idx < 2 && (
                <div className={`flex-1 h-1 mx-4 rounded ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
