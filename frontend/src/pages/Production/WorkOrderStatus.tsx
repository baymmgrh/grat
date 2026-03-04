import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  DocumentPlusIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface WorkOrderStatusItem {
  id: number;
  wo_number: string;
  product_name: string;
  machine_name: string;
  quantity: number;
  quantity_produced: number;
  quantity_good: number;
  status: string;
  input_status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  total_shifts: number;
  last_input_date: string | null;
  last_input_by: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  approval_status: string | null;
}

const STATUS_CONFIG = {
  not_started: {
    label: 'Belum Dimulai',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: DocumentPlusIcon,
    description: 'Work Order belum ada input produksi'
  },
  in_progress: {
    label: 'Sedang Diisi',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: PencilSquareIcon,
    description: 'Work Order sedang dalam proses input'
  },
  completed: {
    label: 'Selesai',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: CheckCircleIcon,
    description: 'Work Order sudah selesai diinput'
  }
};

const WO_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  planned: { label: 'Planned', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  in_progress: { label: 'In Progress', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' }
};

export default function WorkOrderStatus() {
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrderStatusItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrderStatusItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inputStatusFilter, setInputStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Summary stats
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0
  });

  useEffect(() => {
    fetchWorkOrderStatus();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [workOrders, searchTerm, statusFilter, inputStatusFilter]);

  const fetchWorkOrderStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/work-orders/status-tracking');
      const data = response.data.work_orders || [];
      setWorkOrders(data);
      
      // Calculate stats
      const notStarted = data.filter((wo: WorkOrderStatusItem) => wo.input_status === 'not_started').length;
      const inProgress = data.filter((wo: WorkOrderStatusItem) => wo.input_status === 'in_progress').length;
      const completed = data.filter((wo: WorkOrderStatusItem) => wo.input_status === 'completed').length;
      
      setStats({
        total: data.length,
        notStarted,
        inProgress,
        completed
      });
    } catch (error) {
      console.error('Error fetching work order status:', error);
      toast.error('Gagal memuat data status');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...workOrders];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(wo => 
        wo.wo_number.toLowerCase().includes(term) ||
        wo.product_name.toLowerCase().includes(term) ||
        wo.machine_name?.toLowerCase().includes(term)
      );
    }
    
    // WO Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(wo => wo.status === statusFilter);
    }
    
    // Input status filter
    if (inputStatusFilter !== 'all') {
      filtered = filtered.filter(wo => wo.input_status === inputStatusFilter);
    }
    
    setFilteredOrders(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkOrderStatus();
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-7 w-7 text-blue-600" />
            Status Pengerjaan
          </h1>
          <p className="text-gray-600 mt-1">Pantau status input produksi Work Order</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setInputStatusFilter('all')}
          className={`bg-white rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg ${inputStatusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total WO</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setInputStatusFilter('not_started')}
          className={`bg-white rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg ${inputStatusFilter === 'not_started' ? 'ring-2 ring-gray-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <DocumentPlusIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Belum Dimulai</p>
              <p className="text-2xl font-bold text-gray-700">{stats.notStarted}</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setInputStatusFilter('in_progress')}
          className={`bg-white rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg ${inputStatusFilter === 'in_progress' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <PencilSquareIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sedang Diisi</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setInputStatusFilter('completed')}
          className={`bg-white rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg ${inputStatusFilter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Selesai</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari WO Number, Produk, atau Mesin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* WO Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status WO</option>
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Order List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status WO</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status Input</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shift Input</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input Terakhir</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((wo) => {
                const inputConfig = STATUS_CONFIG[wo.input_status];
                const InputIcon = inputConfig.icon;
                const woStatusConfig = WO_STATUS_CONFIG[wo.status] || WO_STATUS_CONFIG.draft;
                
                return (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link 
                        to={`/app/production/work-orders/${wo.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {wo.wo_number}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatDate(wo.start_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{wo.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{wo.machine_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${woStatusConfig.bgColor} ${woStatusConfig.color}`}>
                        {woStatusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${inputConfig.bgColor} ${inputConfig.color}`}>
                        <InputIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">{inputConfig.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${wo.progress_percent >= 100 ? 'bg-green-500' : wo.progress_percent >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min(wo.progress_percent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">
                          {wo.quantity_good?.toLocaleString()} / {wo.quantity?.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-700">{wo.total_shifts}</span>
                      <span className="text-xs text-gray-500"> shift</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {wo.last_input_date ? (
                        <div>
                          <p>{formatDateTime(wo.last_input_date)}</p>
                          {wo.last_input_by && (
                            <p className="text-xs text-gray-400">oleh {wo.last_input_by}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/app/production/work-orders/${wo.id}/input`}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Input Produksi"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/app/production/work-orders/${wo.id}/timeline`}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Timeline"
                        >
                          <ClockIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/app/production/work-orders/${wo.id}`}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Detail"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Tidak ada Work Order ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Keterangan Status Input:</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${config.bgColor}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
