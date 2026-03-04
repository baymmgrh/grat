import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Template {
  id: number;
  template_name: string;
  template_code: string;
  document_type: string;
  paper_size: string;
  orientation: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const documentTypes = [
  // Penjualan
  { value: 'penawaran_penjualan', label: 'Penawaran Penjualan', icon: '📋' },
  { value: 'pesanan_penjualan', label: 'Pesanan Penjualan', icon: '🛒' },
  { value: 'pengiriman_pesanan', label: 'Pengiriman Pesanan', icon: '🚚' },
  { value: 'faktur_penjualan', label: 'Faktur Penjualan', icon: '💰' },
  { value: 'retur_penjualan', label: 'Retur Penjualan', icon: '↩️' },
  { value: 'penerimaan_penjualan', label: 'Penerimaan Penjualan', icon: '💵' },
  // Pembelian
  { value: 'permintaan_barang', label: 'Permintaan Barang', icon: '📝' },
  { value: 'pesanan_pembelian', label: 'Pesanan Pembelian', icon: '🛍️' },
  { value: 'penerimaan_barang', label: 'Penerimaan Barang', icon: '📦' },
  { value: 'faktur_pembelian', label: 'Faktur Pembelian', icon: '🧾' },
  { value: 'retur_pembelian', label: 'Retur Pembelian', icon: '↪️' },
  { value: 'pembayaran_pembelian', label: 'Pembayaran Pembelian', icon: '💳' },
  // Persediaan
  { value: 'pemindahan_barang', label: 'Pemindahan Barang', icon: '🔄' },
  { value: 'penyesuaian_persediaan', label: 'Penyesuaian Persediaan', icon: '📊' },
  { value: 'perintah_stok_opname', label: 'Perintah Stok Opname', icon: '📋' },
  // Produksi
  { value: 'formula_produksi', label: 'Formula Produksi', icon: '🧪' },
  { value: 'perintah_kerja', label: 'Perintah Kerja', icon: '🔧' },
  { value: 'penyelesaian_barang_jadi', label: 'Penyelesaian Barang Jadi', icon: '✅' },
  { value: 'penambahan_bahan_baku', label: 'Penambahan Bahan Baku', icon: '➕' },
  { value: 'pengambilan_bahan_baku', label: 'Pengambilan Bahan Baku', icon: '📤' },
  { value: 'rencana_produksi', label: 'Rencana Produksi', icon: '📅' },
  // Keuangan
  { value: 'penerimaan', label: 'Penerimaan', icon: '💵' },
  { value: 'pembayaran', label: 'Pembayaran', icon: '💳' },
  { value: 'transfer_bank', label: 'Transfer Bank', icon: '🏦' },
  { value: 'jurnal_umum', label: 'Jurnal Umum', icon: '📒' },
  { value: 'slip_gaji', label: 'Slip Gaji', icon: '💰' },
];

export default function TemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [typeFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter) params.document_type = typeFilter;
      
      const response = await axiosInstance.get('/api/documents/templates', { params });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await axiosInstance.put(`/api/documents/templates/${id}/set-default`);
      toast.success('Default template updated');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to set default template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await axiosInstance.delete(`/api/documents/templates/${id}`);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const found = documentTypes.find(t => t.value === type);
    return found ? `${found.icon} ${found.label}` : type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/documents')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <DocumentDuplicateIcon className="h-8 w-8" />
                Document Templates
              </h1>
              <p className="text-purple-100 mt-1">Manage document templates and layouts</p>
            </div>
          </div>
          <Link
            to="/app/documents/templates/new"
            className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              typeFilter === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Types
          </button>
          {documentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setTypeFilter(type.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === type.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <DocumentDuplicateIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No templates found</p>
            <Link
              to="/app/documents/templates/new"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Create your first template
            </Link>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Template Preview Header */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    {template.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <StarSolidIcon className="h-3 w-3" />
                        Default
                      </span>
                    )}
                    {template.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircleIcon className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{template.template_name}</h3>
                <p className="text-sm text-gray-500 mb-3">{getDocumentTypeLabel(template.document_type)}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Cog6ToothIcon className="h-3.5 w-3.5" />
                    {template.paper_size} • {template.orientation}
                  </span>
                  <span>Code: {template.template_code}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      template.is_default
                        ? 'text-yellow-500 bg-yellow-50'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={template.is_default ? 'Default Template' : 'Set as Default'}
                  >
                    {template.is_default ? (
                      <StarSolidIcon className="h-5 w-5" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/app/documents/templates/${template.id}/preview`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/app/documents/templates/${template.id}/edit`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
