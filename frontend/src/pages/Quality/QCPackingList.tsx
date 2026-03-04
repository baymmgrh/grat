import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface PackingListQC {
  id: number;
  packing_number: string;
  product_id: number;
  product_name: string;
  product_code: string;
  customer_name: string | null;
  so_number: string | null;
  pack_per_carton: number;
  total_carton: number;
  total_pcs: number;
  start_carton_number: number;
  end_carton_number: number;
  status: string;
  packing_date: string | null;
  completed_at: string | null;
  qc_status: string | null;
  qc_date: string | null;
  qc_by: string | null;
  qc_notes: string | null;
  released_at: string | null;
  weighed_count: number;
  created_by: string | null;
}

export default function QCPackingList() {
  const [packingLists, setPackingLists] = useState<PackingListQC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [qcNotesModal, setQcNotesModal] = useState<{ show: boolean; plId: number; action: string }>({ show: false, plId: 0, action: '' });
  const [qcNotes, setQcNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/packing-list?per_page=200');
      setPackingLists(res.data.packing_lists || []);
    } catch (error) {
      toast.error('Gagal memuat data packing list');
    } finally {
      setLoading(false);
    }
  };

  const handleQCAction = async (plId: number, action: string, notes: string = '') => {
    try {
      const res = await axiosInstance.post(`/api/packing-list/${plId}/qc`, {
        action,
        qc_notes: notes
      });
      toast.success(res.data.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal update QC');
    }
  };

  const openQCModal = (plId: number, action: string) => {
    setQcNotesModal({ show: true, plId, action });
    setQcNotes('');
  };

  const confirmQCAction = () => {
    handleQCAction(qcNotesModal.plId, qcNotesModal.action, qcNotes);
    setQcNotesModal({ show: false, plId: 0, action: '' });
    setQcNotes('');
  };

  // Filter lists
  const pendingList = packingLists.filter(pl => 
    pl.status === 'completed' || pl.status === 'quarantine'
  );
  const historyList = packingLists.filter(pl => 
    pl.status === 'released' || pl.status === 'rejected'
  );

  const filteredPending = pendingList.filter(pl =>
    !search || 
    pl.packing_number.toLowerCase().includes(search.toLowerCase()) ||
    pl.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (pl.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = historyList.filter(pl =>
    !search || 
    pl.packing_number.toLowerCase().includes(search.toLowerCase()) ||
    pl.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (pl.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; label: string }> = {
      completed: { bg: 'bg-yellow-100 text-yellow-800', label: 'Menunggu QC' },
      quarantine: { bg: 'bg-orange-100 text-orange-800', label: 'Quarantine' },
      released: { bg: 'bg-green-100 text-green-800', label: 'Released' },
      rejected: { bg: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    const c = config[status] || { bg: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-7 w-7 text-purple-600" />
            QC Packing List
          </h1>
          <p className="text-sm text-gray-500">Review dan approval packing list sebelum masuk gudang Finished Goods</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Menunggu QC</p>
          <p className="text-2xl font-bold text-yellow-800">
            {pendingList.filter(p => p.status === 'completed').length}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Quarantine</p>
          <p className="text-2xl font-bold text-orange-800">
            {pendingList.filter(p => p.status === 'quarantine').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Released</p>
          <p className="text-2xl font-bold text-green-800">
            {historyList.filter(p => p.status === 'released').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Rejected</p>
          <p className="text-2xl font-bold text-red-800">
            {historyList.filter(p => p.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-lg shadow mb-0">
        <div className="flex items-center justify-between border-b px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending QC ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Riwayat QC ({historyList.length})
            </button>
          </div>
          <div className="flex items-center gap-2 py-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari packing list..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Packing</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Karton</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Selesai Timbang</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                {activeTab === 'history' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QC Info</th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'pending' ? filteredPending : filteredHistory).length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'history' ? 8 : 7} className="px-4 py-12 text-center text-gray-500">
                    {activeTab === 'pending' 
                      ? 'Tidak ada packing list yang menunggu QC'
                      : 'Belum ada riwayat QC'
                    }
                  </td>
                </tr>
              ) : (
                (activeTab === 'pending' ? filteredPending : filteredHistory).map((pl) => (
                  <tr key={pl.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-purple-600">{pl.packing_number}</span>
                      {pl.packing_date && (
                        <p className="text-xs text-gray-500">{new Date(pl.packing_date).toLocaleDateString('id-ID')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{pl.product_name}</p>
                      <p className="text-xs text-gray-500">{pl.product_code}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {pl.customer_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="font-bold text-gray-900">{pl.total_carton}</span>
                      <p className="text-xs text-gray-500">{pl.total_pcs.toLocaleString()} pcs</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                      {pl.completed_at 
                        ? new Date(pl.completed_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {getStatusBadge(pl.status)}
                    </td>
                    {activeTab === 'history' && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {pl.qc_by && <p className="text-gray-600">Oleh: {pl.qc_by}</p>}
                        {pl.qc_date && (
                          <p className="text-xs text-gray-500">
                            {new Date(pl.qc_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        )}
                        {pl.qc_notes && <p className="text-xs text-gray-400 truncate max-w-[200px]">{pl.qc_notes}</p>}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Link
                          to={`/app/production/packing-list/${pl.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          Detail
                        </Link>
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => openQCModal(pl.id, 'released')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                              title="Release - stok masuk gudang FG"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              Release
                            </button>
                            {pl.status === 'completed' && (
                              <button
                                onClick={() => openQCModal(pl.id, 'quarantine')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-xs"
                                title="Quarantine - tahan untuk review"
                              >
                                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                Hold
                              </button>
                            )}
                            <button
                              onClick={() => openQCModal(pl.id, 'rejected')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                              title="Reject - stok WIP dikembalikan"
                            >
                              <XCircleIcon className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* QC Notes Modal */}
      {qcNotesModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {qcNotesModal.action === 'released' && 'Release Packing List'}
              {qcNotesModal.action === 'quarantine' && 'Quarantine Packing List'}
              {qcNotesModal.action === 'rejected' && 'Reject Packing List'}
            </h3>
            <div className={`rounded-lg p-3 mb-4 text-sm ${
              qcNotesModal.action === 'released' ? 'bg-green-50 text-green-800' :
              qcNotesModal.action === 'quarantine' ? 'bg-orange-50 text-orange-800' :
              'bg-red-50 text-red-800'
            }`}>
              {qcNotesModal.action === 'released' && 'Stok akan masuk ke gudang Finished Goods.'}
              {qcNotesModal.action === 'quarantine' && 'Packing list akan ditahan untuk review lebih lanjut.'}
              {qcNotesModal.action === 'rejected' && 'Stok WIP akan dikembalikan.'}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan QC {qcNotesModal.action === 'rejected' ? '*' : '(opsional)'}
              </label>
              <textarea
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Catatan QC..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setQcNotesModal({ show: false, plId: 0, action: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmQCAction}
                disabled={qcNotesModal.action === 'rejected' && !qcNotes.trim()}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                  qcNotesModal.action === 'released' ? 'bg-green-600 hover:bg-green-700' :
                  qcNotesModal.action === 'quarantine' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {qcNotesModal.action === 'released' && 'Release'}
                {qcNotesModal.action === 'quarantine' && 'Quarantine'}
                {qcNotesModal.action === 'rejected' && 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
