import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface Pipeline {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: number;
  name: string;
  order: number;
  probability: number;
  color_code: string;
  is_closed_won: boolean;
  is_closed_lost: boolean;
}

interface Opportunity {
  id: number;
  opportunity_number: string;
  name: string;
  description?: string;
  value: number;
  probability: number;
  expected_close_date?: string;
  status: string;
  pipeline_id?: number;
  stage_id?: number;
  pipeline_name?: string;
  stage_name?: string;
  stage_color?: string;
  customer_id?: number;
  customer_name?: string;
  lead_id?: number;
  lead_name?: string;
  assigned_to?: number;
  assigned_user_name?: string;
  created_at: string;
  last_activity_date?: string;
}

interface OpportunityStats {
  total_count: number;
  total_value: number;
  weighted_value: number;
  won_count: number;
  won_value: number;
  lost_count: number;
  win_rate: number;
}

const OpportunityListUpgraded: React.FC = () => {
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showActions, setShowActions] = useState<number | null>(null);
  const [stats, setStats] = useState<OpportunityStats>({
    total_count: 0,
    total_value: 0,
    weighted_value: 0,
    won_count: 0,
    won_value: 0,
    lost_count: 0,
    win_rate: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1
  });

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      loadOpportunities();
    }
  }, [searchTerm, selectedPipeline]);

  const loadPipelines = async () => {
    try {
      const response = await axiosInstance.get('/api/sales/pipelines');
      const pipelinesData = response.data.pipelines || [];
      setPipelines(pipelinesData);
      
      const defaultPipeline = pipelinesData.find((p: Pipeline) => p.is_default) || pipelinesData[0];
      setSelectedPipeline(defaultPipeline);
    } catch (error) {
      console.error('Error loading pipelines:', error);
      // Create default pipeline if none exists
      setSelectedPipeline({
        id: 1,
        name: 'Default Pipeline',
        description: 'Default sales pipeline',
        is_default: true,
        stages: [
          { id: 1, name: 'Prospecting', order: 1, probability: 10, color_code: '#3B82F6', is_closed_won: false, is_closed_lost: false },
          { id: 2, name: 'Qualification', order: 2, probability: 25, color_code: '#8B5CF6', is_closed_won: false, is_closed_lost: false },
          { id: 3, name: 'Proposal', order: 3, probability: 50, color_code: '#F59E0B', is_closed_won: false, is_closed_lost: false },
          { id: 4, name: 'Negotiation', order: 4, probability: 75, color_code: '#10B981', is_closed_won: false, is_closed_lost: false },
          { id: 5, name: 'Closed Won', order: 5, probability: 100, color_code: '#22C55E', is_closed_won: true, is_closed_lost: false },
          { id: 6, name: 'Closed Lost', order: 6, probability: 0, color_code: '#EF4444', is_closed_won: false, is_closed_lost: true }
        ]
      });
    }
  };

  const loadOpportunities = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '100'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPipeline) params.append('pipeline_id', selectedPipeline.id.toString());

      const response = await axiosInstance.get(`/api/sales/opportunities?${params}`);
      const oppsData = response.data.opportunities || [];
      setOpportunities(oppsData);
      setPagination({
        total: response.data.total || oppsData.length,
        pages: response.data.pages || 1,
        current_page: response.data.current_page || 1
      });

      // Calculate stats
      const wonOpps = oppsData.filter((o: Opportunity) => o.status === 'won');
      const lostOpps = oppsData.filter((o: Opportunity) => o.status === 'lost');
      const totalValue = oppsData.reduce((sum: number, o: Opportunity) => sum + (o.value || 0), 0);
      const weightedValue = oppsData.reduce((sum: number, o: Opportunity) => sum + ((o.value || 0) * (o.probability || 0) / 100), 0);
      const wonValue = wonOpps.reduce((sum: number, o: Opportunity) => sum + (o.value || 0), 0);
      
      setStats({
        total_count: oppsData.length,
        total_value: totalValue,
        weighted_value: weightedValue,
        won_count: wonOpps.length,
        won_value: wonValue,
        lost_count: lostOpps.length,
        win_rate: oppsData.length > 0 ? Math.round((wonOpps.length / oppsData.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (opportunityId: number, newStageId: number) => {
    try {
      await axiosInstance.put(`/api/sales/opportunities/${opportunityId}`, {
        stage_id: newStageId
      });
      toast.success('Opportunity moved successfully');
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to move opportunity');
    }
  };

  const handleDeleteOpportunity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await axiosInstance.delete(`/api/sales/opportunities/${id}`);
      toast.success('Opportunity deleted successfully');
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to delete opportunity');
    }
  };

  const handleMarkWon = async (id: number) => {
    try {
      await axiosInstance.put(`/api/sales/opportunities/${id}`, { status: 'won' });
      toast.success('Opportunity marked as won!');
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to update opportunity');
    }
  };

  const handleMarkLost = async (id: number) => {
    try {
      await axiosInstance.put(`/api/sales/opportunities/${id}`, { status: 'lost' });
      toast.success('Opportunity marked as lost');
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to update opportunity');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getOpportunitiesByStage = (stageId: number) => {
    return opportunities.filter(o => o.stage_id === stageId);
  };

  const getStageTotal = (stageId: number) => {
    return getOpportunitiesByStage(stageId).reduce((sum, o) => sum + (o.value || 0), 0);
  };

  if (loading && opportunities.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FunnelIcon className="h-8 w-8" />
              Sales Pipeline
            </h1>
            <p className="text-purple-100 mt-1">Manage and track your sales opportunities</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadOpportunities()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <Link
              to="/app/sales/opportunities/new"
              className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Opportunity
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total_count}</div>
          <div className="text-sm text-gray-500">Total Deals</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 col-span-2">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_value)}</div>
          <div className="text-sm text-gray-500">Pipeline Value</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 col-span-2">
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.weighted_value)}</div>
          <div className="text-sm text-blue-600">Weighted Value</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.won_count}</div>
          <div className="text-sm text-green-600">Won</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.win_rate}%</div>
          <div className="text-sm text-green-100">Win Rate</div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Pipeline Selector */}
          {pipelines.length > 1 && (
            <select
              value={selectedPipeline?.id || ''}
              onChange={(e) => {
                const pipeline = pipelines.find(p => p.id === parseInt(e.target.value));
                setSelectedPipeline(pipeline || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              title="Kanban View"
            >
              <Squares2X2Icon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              title="List View"
            >
              <ListBulletIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && selectedPipeline && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {selectedPipeline.stages
              .sort((a, b) => a.order - b.order)
              .map((stage) => {
                const stageOpps = getOpportunitiesByStage(stage.id);
                const stageTotal = getStageTotal(stage.id);
                
                return (
                  <div
                    key={stage.id}
                    className="w-80 flex-shrink-0 bg-gray-50 rounded-xl"
                  >
                    {/* Stage Header */}
                    <div 
                      className="p-4 rounded-t-xl"
                      style={{ backgroundColor: stage.color_code + '20' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color_code }}
                          />
                          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {stageOpps.length}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(stageTotal)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stage.probability}% probability
                      </div>
                    </div>

                    {/* Stage Cards */}
                    <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                      {stageOpps.map((opp) => (
                        <div
                          key={opp.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {opp.name}
                              </h4>
                              <p className="text-xs text-gray-500">{opp.opportunity_number}</p>
                            </div>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActions(showActions === opp.id ? null : opp.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                              </button>
                              {showActions === opp.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                  <Link
                                    to={`/app/sales/opportunities/${opp.id}`}
                                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    View Details
                                  </Link>
                                  <Link
                                    to={`/app/sales/opportunities/${opp.id}/edit`}
                                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                  {!stage.is_closed_won && !stage.is_closed_lost && (
                                    <>
                                      <button
                                        onClick={() => handleMarkWon(opp.id)}
                                        className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                      >
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        Mark Won
                                      </button>
                                      <button
                                        onClick={() => handleMarkLost(opp.id)}
                                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <XCircleIcon className="h-4 w-4 mr-2" />
                                        Mark Lost
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDeleteOpportunity(opp.id)}
                                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Value */}
                          <div className="text-lg font-bold text-gray-900 mb-2">
                            {formatCurrency(opp.value)}
                          </div>

                          {/* Customer */}
                          {opp.customer_name && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {opp.customer_name}
                            </div>
                          )}

                          {/* Expected Close */}
                          {opp.expected_close_date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Close: {new Date(opp.expected_close_date).toLocaleDateString()}
                            </div>
                          )}

                          {/* Probability Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Probability</span>
                              <span>{opp.probability}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${opp.probability}%`,
                                  backgroundColor: stage.color_code
                                }}
                              />
                            </div>
                          </div>

                          {/* Assigned */}
                          {opp.assigned_user_name && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-xs font-medium text-purple-600">
                                  {opp.assigned_user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">{opp.assigned_user_name}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add New Card */}
                      <button
                        onClick={() => navigate(`/app/sales/opportunities/new?stage_id=${stage.id}`)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Deal
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Close</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{opp.name}</div>
                        <div className="text-sm text-gray-500">{opp.opportunity_number}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {opp.customer_name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{ 
                          backgroundColor: (opp.stage_color || '#6B7280') + '20',
                          color: opp.stage_color || '#6B7280'
                        }}
                      >
                        {opp.stage_name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(opp.value)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="h-2 rounded-full bg-purple-600"
                            style={{ width: `${opp.probability}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{opp.probability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {opp.expected_close_date 
                        ? new Date(opp.expected_close_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {opp.assigned_user_name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/sales/opportunities/${opp.id}`}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          View
                        </Link>
                        <Link
                          to={`/app/sales/opportunities/${opp.id}/edit`}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteOpportunity(opp.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {opportunities.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No opportunities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first opportunity.
          </p>
          <div className="mt-6">
            <Link
              to="/app/sales/opportunities/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Opportunity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityListUpgraded;
