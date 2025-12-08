import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import {
  DocumentTextIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: number;
  document_number: string;
  document_title: string;
  document_type: string;
  reference_number: string;
  status: string;
  document_date: string;
  print_count: number;
  created_at: string;
}

interface DashboardStats {
  total_documents: number;
  total_templates: number;
  by_type: Array<{ type: string; count: number }>;
}

export default function DocumentDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_documents: 0,
    total_templates: 0,
    by_type: []
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const statsRes = await axiosInstance.get('/api/documents/dashboard');
      setStats(statsRes.data.statistics);
      
      // Load documents
      const params: any = {};
      if (filter !== 'all') {
        params.document_type = filter;
      }
      
      const docsRes = await axiosInstance.get('/api/documents', { params });
      setDocuments(docsRes.data.documents);
      
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (id: number) => {
    try {
      const res = await axiosInstance.get(`/api/documents/${id}/preview`);
      const htmlContent = res.data.document.html_content;
      
      // Open preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('Error previewing document:', error);
    }
  };

  const handleDownloadPDF = async (id: number, documentNumber: string) => {
    try {
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
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDownloadExcel = async (id: number, documentNumber: string) => {
    try {
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
    } catch (error) {
      console.error('Error downloading Excel:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'printed':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'surat_jalan': 'Surat Jalan',
      'spk': 'Surat Perintah Kerja',
      'invoice': 'Invoice',
      'purchase_order': 'Purchase Order',
      'delivery_note': 'Delivery Note',
      'work_order': 'Work Order'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Generate and manage official documents</p>
        </div>
        <Link
          to="/app/documents/generate"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Generate Document
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Documents</p>
              <p className="text-3xl font-bold mt-2">{stats.total_documents}</p>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Templates</p>
              <p className="text-3xl font-bold mt-2">{stats.total_templates}</p>
            </div>
            <DocumentDuplicateIcon className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Document Types</p>
              <p className="text-3xl font-bold mt-2">{stats.by_type.length}</p>
            </div>
            <DocumentDuplicateIcon className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Document Types Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Documents
          </button>
          {stats.by_type.map((type) => (
            <button
              key={type.type}
              onClick={() => setFilter(type.type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getDocumentTypeLabel(type.type)} ({type.count})
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Print Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p>No documents found</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.document_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{doc.document_title || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getDocumentTypeLabel(doc.document_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.reference_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(doc.document_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <PrinterIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {doc.print_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(doc.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Preview"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(doc.id, doc.document_number)}
                          className="text-red-600 hover:text-red-900"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(doc.id, doc.document_number)}
                          className="text-green-600 hover:text-green-900"
                          title="Download Excel"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
