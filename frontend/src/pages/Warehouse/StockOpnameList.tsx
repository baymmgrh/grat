import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface StockOpnameOrder {
  id: number;
  opname_number: string;
  zone_name: string;
  opname_type: string;
  scheduled_date: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  assigned_to_name: string | null;
  total_items: number;
  counted_items: number;
  variance_items: number;
  total_variance_value: number;
  created_by_name: string;
  created_at: string;
}

const STATUS_COLORS: { [key: string]: string } = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: { [key: string]: string } = {
  draft: 'Draft',
  scheduled: 'Terjadwal',
  in_progress: 'Sedang Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const TYPE_LABELS: { [key: string]: string } = {
  full: 'Full Count',
  partial: 'Partial',
  cycle: 'Cycle Count',
};

export default function StockOpnameList() {
  const [orders, setOrders] = useState<StockOpnameOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await axiosInstance.get(`/api/stock-opname/orders?${params}`);
      setOrders(response.data.orders || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat data stok opname');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, opnameNumber: string) => {
    if (!window.confirm(`Hapus stok opname ${opnameNumber}?`)) return;

    try {
      await axiosInstance.delete(`/api/stock-opname/orders/${id}`);
      toast.success('Stok opname berhasil dihapus');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus');
    }
  };

  const handleStart = async (id: number) => {
    try {
      await axiosInstance.put(`/api/stock-opname/orders/${id}/start`);
      toast.success('Stok opname dimulai');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memulai');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading && orders.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
            Stok Opname
          </h1>
          <p className="text-gray-600">Kelola penghitungan fisik inventory</p>
        </div>
        <Link
          to="/app/warehouse/stock-opname/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Buat Perintah Opname
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Terjadwal</option>
            <option value="in_progress">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                No. Opname
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Zona
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Jadwal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Selisih
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Belum ada data stok opname</p>
                  <Link
                    to="/app/warehouse/stock-opname/new"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Buat perintah opname baru
                  </Link>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/app/warehouse/stock-opname/${order.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {order.opname_number}
                    </Link>
                    <p className="text-xs text-gray-500">
                      oleh {order.created_by_name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.zone_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {TYPE_LABELS[order.opname_type] || order.opname_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(order.scheduled_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${order.total_items > 0 ? (order.counted_items / order.total_items) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {order.counted_items}/{order.total_items}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'completed' ? (
                      <div>
                        <span className={`text-sm font-medium ${order.variance_items > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {order.variance_items} item
                        </span>
                        {order.total_variance_value !== 0 && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(order.total_variance_value)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === 'draft' && (
                        <button
                          onClick={() => handleStart(order.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Mulai Opname"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>
                      )}
                      <Link
                        to={`/app/warehouse/stock-opname/${order.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Lihat Detail"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      {(order.status === 'draft' || order.status === 'cancelled') && (
                        <button
                          onClick={() => handleDelete(order.id, order.opname_number)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-600">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
