import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface ProductionApproval {
  id: number;
  approval_number: string;
  work_order_id: number;
  wo_number: string;
  product_name: string;
  quantity_produced: number;
  quantity_good: number;
  quantity_reject: number;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
  status: string;
  submitter_name: string;
  submitted_at: string;
  reviewer_name: string | null;
  reviewed_at: string | null;
  forwarded_to_finance: boolean;
}

interface Summary {
  pending: number;
  approved: number;
  rejected: number;
  forwarded: number;
}

const ProductionApprovalList: React.FC = () => {
  const [approvals, setApprovals] = useState<ProductionApproval[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0, forwarded: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await axiosInstance.get('/api/production/production-approvals', { params });
      setApprovals(response.data.approvals || []);
      setSummary(response.data.summary || { pending: 0, approved: 0, rejected: 0, forwarded: 0 });
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Gagal memuat data approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, forwarded: boolean) => {
    if (forwarded) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Forwarded to Finance</span>;
    }
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Menunggu Approval</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Disetujui</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Ditolak</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Produksi</h1>
          <p className="text-gray-600">Approval Manager Produksi sebelum forward ke Finance</p>
        </div>
        <button
          onClick={fetchApprovals}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 ${statusFilter === 'pending' ? 'border-yellow-500' : 'border-transparent'}`}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Menunggu Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        
        <div 
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 ${statusFilter === 'approved' ? 'border-green-500' : 'border-transparent'}`}
          onClick={() => setStatusFilter(statusFilter === 'approved' ? '' : 'approved')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <div 
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 ${statusFilter === 'rejected' ? 'border-red-500' : 'border-transparent'}`}
          onClick={() => setStatusFilter(statusFilter === 'rejected' ? '' : 'rejected')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
            </div>
            <XCircleIcon className="h-10 w-10 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Diteruskan ke Finance</p>
              <p className="text-2xl font-bold text-purple-600">{summary.forwarded}</p>
            </div>
            <BanknotesIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filter */}
      {statusFilter && (
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">Filter: {statusFilter}</span>
          <button 
            onClick={() => setStatusFilter('')}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12">
            <DocumentCheckIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Tidak ada approval</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Approval</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Good</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-blue-600">{approval.approval_number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {approval.wo_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {approval.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {approval.quantity_good.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(approval.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatCurrency(approval.cost_per_unit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(approval.status, approval.forwarded_to_finance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{approval.submitter_name}</div>
                    <div className="text-xs">{formatDate(approval.submitted_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      to={`/app/production/approvals/${approval.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductionApprovalList;
