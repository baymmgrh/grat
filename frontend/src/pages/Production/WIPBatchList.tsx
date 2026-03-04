import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface WIPBatch {
  id: number;
  wip_batch_no: string;
  work_order_no: string;
  product_name: string;
  current_stage: string;
  machine_name?: string;
  line_name?: string;
  qty_started: number;
  qty_completed: number;
  qty_rejected: number;
  qty_in_process: number;
  completion_percentage: number;
  rejection_rate: number;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_wip_value: number;
  status: string;
  operator_name?: string;
  shift?: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
}

interface Filters {
  status: string;
  stage: string;
  work_order_id: string;
  date_from: string;
  date_to: string;
  search: string;
}

const WIPBatchList: React.FC = () => {
  const { t } = useLanguage();

  const [wipBatches, setWipBatches] = useState<WIPBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    stage: '',
    work_order_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  const [stages, setStages] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    fetchWipBatches();
    fetchProductionStages();
  }, [filters]);

  const fetchWipBatches = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.stage) params.stage = filters.stage;
      if (filters.work_order_id) params.work_order_id = filters.work_order_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await axiosInstance.get('/api/wip/wip-batches', { params });
      let batches = response.data.wip_batches || [];

      // Apply client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        batches = batches.filter((batch: WIPBatch) =>
          batch.wip_batch_no.toLowerCase().includes(searchLower) ||
          batch.work_order_no.toLowerCase().includes(searchLower) ||
          batch.product_name.toLowerCase().includes(searchLower) ||
          batch.current_stage.toLowerCase().includes(searchLower)
        );
      }

      setWipBatches(batches);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch WIP batches:', error);
      setError(error.response?.data?.error || 'Failed to fetch WIP batches');
      setWipBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionStages = async () => {
    try {
      const response = await axiosInstance.get('/api/wip/production-stages');
      setStages(response.data.stages || []);
    } catch (error) {
      console.error('Failed to fetch production stages:', error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      stage: '',
      work_order_id: '',
      date_from: '',
      date_to: '',
      search: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <PlayIcon className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <CogIcon className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <PauseIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <PauseIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-800' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    const config = statusConfig[status] || statusConfig.open;
    return `px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`;
  };

  const getStageBadge = (stage: string) => {
    const stageColors: Record<string, string> = {
      ready_to_start: 'bg-gray-100 text-gray-800',
      cutting: 'bg-blue-100 text-blue-800',
      filling: 'bg-purple-100 text-purple-800',
      sealing: 'bg-orange-100 text-orange-800',
      packing: 'bg-green-100 text-green-800',
      quality_check: 'bg-yellow-100 text-yellow-800',
      finished: 'bg-green-100 text-green-800'
    };
    const color = stageColors[stage] || 'bg-gray-100 text-gray-800';
    return `px-2 py-1 rounded-full text-xs font-medium ${color}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WIP Batches</h1>
          <p className="text-gray-600">Work in Progress batch tracking and management</p>
        </div>
        <Link to="/app/production/wip-batches/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create WIP Batch
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search WIP batches, work orders, products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* FunnelIcon Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>

            {/* Refresh */}
            <button
              onClick={fetchWipBatches}
              className="btn-secondary inline-flex items-center gap-2"
              disabled={loading}
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={filters.stage}
                    onChange={(e) => handleFilterChange('stage', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Stages</option>
                    {stages.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              WIP Batches ({wipBatches.length})
            </h3>
            <div className="text-sm text-gray-500">
              Total WIP Value: {formatCurrency(wipBatches.reduce((sum, batch) => sum + batch.total_wip_value, 0))}
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading WIP batches...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading WIP Batches</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button onClick={fetchWipBatches} className="btn-primary">
              </button>
            </div>
          ) : wipBatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>WIP Batch No</th>
                    <th>Work Order</th>
                    <th>{t('production.product')}</th>
                    <th>Current Stage</th>
                    <th>Progress</th>
                    <th>Quantities</th>
                    <th>WIP Value</th>
                    <th>{t('common.status')}</th>
                    <th>Started</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wipBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td className="font-medium">{batch.wip_batch_no}</td>
                      <td>{batch.work_order_no}</td>
                      <td>{batch.product_name}</td>
                      <td>
                        <span className={getStageBadge(batch.current_stage)}>
                          {batch.current_stage.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${batch.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {batch.completion_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs">
                          <div>Started: {batch.qty_started}</div>
                          <div className="text-green-600">Good: {batch.qty_completed}</div>
                          <div className="text-red-600">Rejected: {batch.qty_rejected}</div>
                          <div className="text-blue-600">In Process: {batch.qty_in_process}</div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(batch.total_wip_value)}</div>
                          <div className="text-xs text-gray-500">
                            M: {formatCurrency(batch.material_cost)}
                          </div>
                          <div className="text-xs text-gray-500">
                            L: {formatCurrency(batch.labor_cost)}
                          </div>
                          <div className="text-xs text-gray-500">
                            O: {formatCurrency(batch.overhead_cost)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          {getStatusIcon(batch.status)}
                          <span className={getStatusBadge(batch.status)}>
                            {batch.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-500">
                        {formatDate(batch.started_at)}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/app/production/wip-batches/${batch.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WIP Batches Found</h3>
              <p className="text-gray-500 mb-4">
                {Object.values(filters).some(f => f) 
                  ? 'No WIP batches match your current filters.'
                  : 'No WIP batches have been created yet.'
                }
              </p>
              <div className="flex justify-center space-x-4">
                {Object.values(filters).some(f => f) && (
                  <button onClick={clearFilters} className="btn-secondary">
                    Clear Filters
                  </button>
                )}
                <Link to="/app/production/wip-batches/new" className="btn-primary">
                  Create First WIP Batch
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WIPBatchList;
