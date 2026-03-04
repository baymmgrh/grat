import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface PendingQCWorkOrder {
  id: number;
  wo_number: string;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  quantity_produced: number;
  quantity_good: number;
  quantity_scrap: number;
  uom: string;
  batch_number: string | null;
  machine_name: string | null;
  completed_date: string | null;
  qc_status: 'pending' | 'completed';
  qc_result: string | null;
  qc_test_id: number | null;
  qc_test_number: string | null;
}

export default function PendingQC() {
  const navigate = useNavigate();
  const [pendingList, setPendingList] = useState<PendingQCWorkOrder[]>([]);
  const [completedList, setCompletedList] = useState<PendingQCWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const fetchPendingQC = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:5000/api/quality/pending-qc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pending QC');

      const data = await response.json();
      setPendingList(data.pending_qc || []);
      setCompletedList(data.completed_qc || []);
    } catch (error) {
      console.error('Error fetching pending QC:', error);
      toast.error('Gagal memuat data QC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQC();
  }, []);

  const handleCreateQCTest = (workOrder: PendingQCWorkOrder) => {
    // Navigate to the new QC form with work order data
    navigate(`/app/quality/pending-qc/${workOrder.id}`);
  };

  const filteredPending = pendingList.filter(wo =>
    wo.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = completedList.filter(wo =>
    wo.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Passed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircleIcon className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'conditional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Conditional
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <ClockIcon className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-7 h-7 text-blue-600" />
            QC Work Order
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Daftar Work Order yang memerlukan Quality Control
          </p>
        </div>
        <button
          onClick={fetchPendingQC}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu QC</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sudah QC</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BeakerIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total WO Selesai</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingList.length + completedList.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari WO Number, Produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Menunggu QC ({filteredPending.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sudah QC ({filteredCompleted.length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qty Produksi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mesin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Selesai
                  </th>
                  {activeTab === 'completed' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Hasil QC
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(activeTab === 'pending' ? filteredPending : filteredCompleted).map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{wo.wo_number}</p>
                        {wo.batch_number && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Batch: {wo.batch_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{wo.product_code}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{wo.product_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {wo.quantity_produced.toLocaleString()} {wo.uom}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Good: {wo.quantity_good.toLocaleString()} | Scrap: {wo.quantity_scrap.toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                      {wo.machine_name || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(wo.completed_date)}
                    </td>
                    {activeTab === 'completed' && (
                      <td className="px-4 py-4">
                        <div>
                          {getResultBadge(wo.qc_result)}
                          {wo.qc_test_number && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{wo.qc_test_number}</p>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4 text-right">
                      {activeTab === 'pending' ? (
                        <button
                          onClick={() => handleCreateQCTest(wo)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <BeakerIcon className="w-4 h-4" />
                          Input QC
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/app/quality/pending-qc/${wo.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                        >
                          <MagnifyingGlassIcon className="w-4 h-4" />
                          Lihat Detail
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(activeTab === 'pending' ? filteredPending : filteredCompleted).length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'completed' ? 7 : 6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {activeTab === 'pending' 
                            ? 'Tidak ada Work Order yang menunggu QC'
                            : 'Tidak ada Work Order yang sudah di-QC'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
