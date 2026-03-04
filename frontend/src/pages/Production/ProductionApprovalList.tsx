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
  BanknotesIcon,
  CalendarDaysIcon,
  CubeIcon
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

interface ScheduleApproval {
  id: number;
  plan_number: string;
  week_number: number;
  year: number;
  week_start: string;
  week_end: string;
  total_items: number;
  total_quantity: number;
  status: string;
  creator_name: string;
  created_at: string;
  approver_name: string | null;
  approved_at: string | null;
}

interface ScheduleSummary {
  pending: number;
  approved: number;
  rejected: number;
  in_progress: number;
}

interface Summary {
  pending: number;
  approved: number;
  rejected: number;
  forwarded: number;
}

interface MonthlyPlanItem {
  id: number;
  product_code: string;
  product_name: string;
  machine_name: string;
  target_ctn: number;
  qty_per_ctn: number;
  target_pack: number;
  priority: string;
}

interface MonthlyPlanApproval {
  year: number;
  month: number;
  month_name: string;
  total_items: number;
  total_quantity: number;
  total_pack: number;
  status: string;
  items: MonthlyPlanItem[];
}

interface ScheduleGridApproval {
  week_start: string;
  week_number: number;
  year: number;
  total_items: number;
  total_ctn: number;
  status: string;
}

const ProductionApprovalList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'production' | 'schedule' | 'monthly' | 'scheduleGrid'>('production');
  const [approvals, setApprovals] = useState<ProductionApproval[]>([]);
  const [scheduleApprovals, setScheduleApprovals] = useState<ScheduleApproval[]>([]);
  const [monthlyPlanApprovals, setMonthlyPlanApprovals] = useState<MonthlyPlanApproval[]>([]);
  const [scheduleGridApprovals, setScheduleGridApprovals] = useState<ScheduleGridApproval[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0, forwarded: 0 });
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary>({ pending: 0, approved: 0, rejected: 0, in_progress: 0 });
  const [monthlyPlanSummary, setMonthlyPlanSummary] = useState({ pending: 0 });
  const [scheduleGridSummary, setScheduleGridSummary] = useState({ pending: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedMonthlyPlan, setExpandedMonthlyPlan] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'production') {
      fetchApprovals();
    } else if (activeTab === 'schedule') {
      fetchScheduleApprovals();
    } else if (activeTab === 'monthly') {
      fetchMonthlyPlanApprovals();
    } else if (activeTab === 'scheduleGrid') {
      fetchScheduleGridApprovals();
    }
  }, [statusFilter, activeTab]);

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

  const fetchScheduleApprovals = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/weekly-plans/pending-approval');
      const allPlans = [
        ...(response.data.pending_plans || []),
        ...(response.data.recent_reviewed || [])
      ];
      setScheduleApprovals(allPlans);
      setScheduleSummary(response.data.summary || { pending: 0, approved: 0, rejected: 0, in_progress: 0 });
    } catch (error) {
      console.error('Error fetching schedule approvals:', error);
      toast.error('Gagal memuat data approval jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyPlanApprovals = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/monthly-schedule/pending-approval');
      setMonthlyPlanApprovals(response.data.pending_plans || []);
      setMonthlyPlanSummary(response.data.summary || { pending: 0 });
    } catch (error) {
      console.error('Error fetching monthly plan approvals:', error);
      toast.error('Gagal memuat data approval rencana bulanan');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMonthlyPlan = async (year: number, month: number, action: 'approve' | 'reject') => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} rencana produksi bulan ini?`)) return;
    
    try {
      await axiosInstance.post('/api/production/monthly-schedule/approve', { year, month, action });
      toast.success(`Rencana produksi berhasil ${action === 'approve' ? 'diapprove' : 'ditolak'}!`);
      fetchMonthlyPlanApprovals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memproses approval');
    }
  };

  const fetchScheduleGridApprovals = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/schedule-grid/pending-approval');
      setScheduleGridApprovals(response.data.pending_plans || []);
      setScheduleGridSummary(response.data.summary || { pending: 0 });
    } catch (error) {
      console.error('Error fetching schedule grid approvals:', error);
      toast.error('Gagal memuat data approval jadwal mingguan');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveScheduleGrid = async (week_start: string, action: 'approve' | 'reject') => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} jadwal mingguan ini?`)) return;
    
    try {
      await axiosInstance.post('/api/production/schedule-grid/approve', { week_start, action });
      toast.success(`Jadwal mingguan berhasil ${action === 'approve' ? 'diapprove' : 'ditolak'}!`);
      fetchScheduleGridApprovals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memproses approval');
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

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Draft</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Menunggu Approval</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Disetujui</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Ditolak</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Sedang Berjalan</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Selesai</span>;
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
    <div className="p-6 space-y-6 h-full overflow-auto">
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('production')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'production'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CubeIcon className="h-5 w-5" />
            Approval Produksi
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Approval Schedule
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'monthly'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Approval Monthly Plan
          </button>
          <button
            onClick={() => setActiveTab('scheduleGrid')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'scheduleGrid'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Approval Jadwal Mingguan
          </button>
        </nav>
      </div>

      {/* Summary Cards - Only show for Production tab */}
      {activeTab === 'production' && (
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
      )}

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

      {/* Production Approval Table */}
      {activeTab === 'production' && (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
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
                    <Link 
                      to={`/app/production/approvals/${approval.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {approval.approval_number}
                    </Link>
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
      )}

      {/* Schedule Approval Table */}
      {activeTab === 'schedule' && (
      <>
        {/* Schedule Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Menunggu Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{scheduleSummary.pending}</p>
              </div>
              <ClockIcon className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">{scheduleSummary.approved}</p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ditolak</p>
                <p className="text-2xl font-bold text-red-600">{scheduleSummary.rejected}</p>
              </div>
              <XCircleIcon className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sedang Berjalan</p>
                <p className="text-2xl font-bold text-blue-600">{scheduleSummary.in_progress}</p>
              </div>
              <CubeIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-500px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : scheduleApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Tidak ada jadwal produksi yang perlu diapprove</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat Oleh</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleApprovals.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/app/production/weekly-plans/${plan.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {plan.plan_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Minggu {plan.week_number}, {plan.year}</div>
                      <div className="text-xs text-gray-500">
                        {plan.week_start && new Date(plan.week_start).toLocaleDateString('id-ID')} - {plan.week_end && new Date(plan.week_end).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {plan.total_items} produk
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {plan.total_quantity?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getScheduleStatusBadge(plan.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{plan.creator_name}</div>
                      <div className="text-xs">{plan.created_at && formatDate(plan.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/app/production/weekly-plans/${plan.id}`}
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
      </>
      )}

      {/* Monthly Plan Approval Table */}
      {activeTab === 'monthly' && (
      <>
        {/* Monthly Plan Summary Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Menunggu Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{monthlyPlanSummary.pending}</p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : monthlyPlanApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Tidak ada rencana produksi bulanan yang perlu diapprove</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {monthlyPlanApprovals.map((plan) => {
                const planKey = `${plan.year}-${plan.month}`;
                const isExpanded = expandedMonthlyPlan === planKey;
                return (
                  <div key={planKey} className="bg-white">
                    {/* Header Row */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedMonthlyPlan(isExpanded ? null : planKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{plan.month_name} {plan.year}</h3>
                            <p className="text-sm text-gray-500">
                              {plan.total_items} produk • {plan.total_quantity?.toLocaleString()} Karton • {plan.total_pack?.toLocaleString()} Pack
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Menunggu Approval
                          </span>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApproveMonthlyPlan(plan.year, plan.month, 'approve')}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-sm"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveMonthlyPlan(plan.year, plan.month, 'reject')}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-sm"
                            >
                              <XCircleIcon className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Detail */}
                    {isExpanded && plan.items && (
                      <div className="px-4 pb-4">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-600">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Kode Produk</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Nama Produk</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Mesin</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">Target (CTN)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Pck/Ctn</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">Target (PCK)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Priority</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {plan.items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.product_code}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-600">{item.machine_name}</td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{item.target_ctn?.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-600">{item.qty_per_ctn}</td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{item.target_pack?.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                      item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {item.priority?.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-blue-50">
                              <tr>
                                <td colSpan={4} className="px-4 py-3 text-sm font-bold text-right text-gray-900">TOTAL</td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{plan.total_quantity?.toLocaleString()}</td>
                                <td className="px-4 py-3"></td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{plan.total_pack?.toLocaleString()}</td>
                                <td className="px-4 py-3"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
      )}

      {/* Schedule Grid Approval Table */}
      {activeTab === 'scheduleGrid' && (
      <>
        {/* Schedule Grid Summary Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Menunggu Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{scheduleGridSummary.pending}</p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : scheduleGridApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Tidak ada jadwal mingguan yang perlu diapprove</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Karton</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleGridApprovals.map((plan) => (
                  <tr key={plan.week_start} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">Minggu {plan.week_number}, {plan.year}</div>
                      <div className="text-xs text-gray-500">Mulai: {plan.week_start}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {plan.total_items} produk
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {plan.total_ctn?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Menunggu Approval
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApproveScheduleGrid(plan.week_start, 'approve')}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveScheduleGrid(plan.week_start, 'reject')}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </>
      )}
    </div>
  );
};

export default ProductionApprovalList;
