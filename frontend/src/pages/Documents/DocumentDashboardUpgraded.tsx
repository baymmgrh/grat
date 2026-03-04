import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  FolderIcon,
  ChartBarIcon,
  CalendarIcon,
  EllipsisVerticalIcon,
  DocumentArrowDownIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: number;
  document_number: string;
  document_title: string;
  document_type: string;
  reference_type?: string;
  reference_number?: string;
  reference_id?: number;
  status: string;
  document_date: string;
  print_count: number;
  created_at: string;
  created_by_name?: string;
}

interface Template {
  id: number;
  template_name: string;
  template_code: string;
  document_type: string;
  is_default: boolean;
}

interface DashboardStats {
  total_documents: number;
  total_templates: number;
  documents_today: number;
  documents_this_month: number;
  by_type: Array<{ type: string; count: number }>;
  by_status: Array<{ status: string; count: number }>;
  recent_activity: Array<{ action: string; document: string; date: string }>;
}

const documentTypes = [
  { value: 'surat_jalan', label: 'Surat Jalan', icon: '📦', color: 'blue' },
  { value: 'spk', label: 'Surat Perintah Kerja', icon: '🔧', color: 'orange' },
  { value: 'invoice', label: 'Invoice', icon: '💰', color: 'green' },
  { value: 'purchase_order', label: 'Purchase Order', icon: '🛒', color: 'purple' },
  { value: 'delivery_note', label: 'Delivery Note', icon: '🚚', color: 'teal' },
  { value: 'work_order', label: 'Work Order', icon: '⚙️', color: 'yellow' },
  { value: 'quotation', label: 'Quotation', icon: '📋', color: 'indigo' },
  { value: 'receipt', label: 'Receipt', icon: '🧾', color: 'pink' }
];

export default function DocumentDashboardUpgraded() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_documents: 0,
    total_templates: 0,
    documents_today: 0,
    documents_this_month: 0,
    by_type: [],
    by_status: [],
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showActions, setShowActions] = useState<number | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const statsRes = await axiosInstance.get('/api/documents/dashboard');
      if (statsRes.data.statistics) {
        setStats({
          ...stats,
          ...statsRes.data.statistics
        });
      }
      
      // Load templates
      const templatesRes = await axiosInstance.get('/api/documents/templates');
      setTemplates(templatesRes.data.templates || []);
      
      // Load documents with filters
      const params: any = {};
      if (typeFilter) params.document_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date_range = dateFilter;
      
      const docsRes = await axiosInstance.get('/api/documents', { params });
      setDocuments(docsRes.data.documents || []);
      
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.document_number.toLowerCase().includes(term) ||
      doc.document_title?.toLowerCase().includes(term) ||
      doc.reference_number?.toLowerCase().includes(term)
    );
  }, [documents, searchTerm]);

  const handlePreview = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/api/documents/${id}/preview`);
      const htmlContent = res.data.document?.html_content || res.data.html_content;
      
      const previewWindow = window.open('', '_blank');
      if (previewWindow && htmlContent) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
      }
    } catch (error) {
      toast.error('Failed to preview document');
    }
  };

  const handleDownloadPDF = async (id: number, documentNumber: string) => {
    try {
      toast.loading('Generating PDF...');
      const response = await axiosInstance.get(`/api/documents/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${documentNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('PDF downloaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download PDF');
    }
  };

  const handleDownloadExcel = async (id: number, documentNumber: string) => {
    try {
      toast.loading('Generating Excel...');
      const response = await axiosInstance.get(`/api/documents/${id}/excel`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${documentNumber}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('Excel downloaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download Excel');
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/api/documents/${id}/preview`);
      const htmlContent = res.data.document?.html_content || res.data.html_content;
      
      const printWindow = window.open('', '_blank');
      if (printWindow && htmlContent) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
        
        // Update print count
        await axiosInstance.post(`/api/documents/${id}/print`);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to print document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axiosInstance.delete(`/api/documents/${id}`);
      toast.success('Document deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select documents to download');
      return;
    }
    toast.loading('Preparing bulk download...');
    for (const id of selectedDocs) {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        await handleDownloadPDF(id, doc.document_number);
      }
    }
    toast.dismiss();
    setSelectedDocs([]);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; icon: any }> = {
      draft: { color: 'text-gray-600', bgColor: 'bg-gray-100 border-gray-200', icon: ClockIcon },
      generated: { color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-200', icon: DocumentTextIcon },
      printed: { color: 'text-green-600', bgColor: 'bg-green-100 border-green-200', icon: PrinterIcon },
      sent: { color: 'text-purple-600', bgColor: 'bg-purple-100 border-purple-200', icon: PaperAirplaneIcon },
      approved: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 border-emerald-200', icon: CheckCircleIcon }
    };
    return configs[status] || configs.draft;
  };

  const getDocumentTypeConfig = (type: string) => {
    return documentTypes.find(t => t.value === type) || { label: type, icon: '📄', color: 'gray' };
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8" />
              Document Management
            </h1>
            <p className="text-indigo-100 mt-1">Generate, manage, and track all business documents</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <Link
              to="/app/documents/templates"
              className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
              Templates
            </Link>
            <Link
              to="/app/documents/generate"
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Generate Document
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_documents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Templates</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_templates}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <DocumentDuplicateIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.documents_today || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.documents_this_month || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Generate Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Generate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {documentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => navigate(`/app/documents/generate?type=${type.value}`)}
              className={`p-4 rounded-xl border-2 border-gray-200 hover:border-${type.color}-400 hover:bg-${type.color}-50 transition-all text-center group`}
            >
              <span className="text-2xl block mb-2">{type.icon}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by document number, title, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="printed">Printed</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <TableCellsIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <FolderIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">{selectedDocs.length} selected</span>
            <button
              onClick={handleBulkDownload}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download All
            </button>
            <button
              onClick={() => setSelectedDocs([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Documents Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocs(filteredDocuments.map(d => d.id));
                        } else {
                          setSelectedDocs([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prints</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No documents found</p>
                      <Link
                        to="/app/documents/generate"
                        className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Generate your first document
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const statusConfig = getStatusConfig(doc.status);
                    const typeConfig = getDocumentTypeConfig(doc.document_type);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocs([...selectedDocs, doc.id]);
                              } else {
                                setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{doc.document_number}</div>
                            <div className="text-sm text-gray-500">{doc.document_title || '-'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <span>{typeConfig.icon}</span>
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {doc.reference_number || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(doc.document_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <PrinterIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {doc.print_count}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handlePreview(doc.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Preview"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handlePrint(doc.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Print"
                            >
                              <PrinterIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(doc.id, doc.document_number)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <DocumentArrowDownIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadExcel(doc.id, doc.document_number)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download Excel"
                            >
                              <TableCellsIcon className="h-5 w-5" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setShowActions(showActions === doc.id ? null : doc.id)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </button>
                              {showActions === doc.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                  <button
                                    onClick={() => {
                                      navigate(`/app/documents/${doc.id}/edit`);
                                      setShowActions(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDelete(doc.id);
                                      setShowActions(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
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
      )}

      {/* Documents Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No documents found</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const statusConfig = getStatusConfig(doc.status);
              const typeConfig = getDocumentTypeConfig(doc.document_type);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{typeConfig.icon}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {doc.status}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1">{doc.document_number}</h3>
                  <p className="text-sm text-gray-500 mb-3 truncate">{doc.document_title || typeConfig.label}</p>
                  
                  <div className="text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1 mb-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {new Date(doc.document_date).toLocaleDateString('id-ID')}
                    </div>
                    {doc.reference_number && (
                      <div className="flex items-center gap-1">
                        <FolderIcon className="h-3.5 w-3.5" />
                        {doc.reference_number}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <PrinterIcon className="h-3.5 w-3.5 mr-1" />
                      {doc.print_count} prints
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePreview(doc.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Preview"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(doc.id, doc.document_number)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(doc.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Print"
                      >
                        <PrinterIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
