import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/Layout/PageHeader';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
  Squares2X2Icon
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
  pipeline_name?: string;
  stage_name?: string;
  stage_color?: string;
  customer_name?: string;
  lead_name?: string;
  assigned_to?: number;
  assigned_user_name?: string;
  created_at: string;
  last_activity_date?: string;
}

const OpportunityList: React.FC = () => {
  const { t } = useLanguage();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1
  });

  useEffect(() => {
    loadPipelines();
    loadOpportunities();
  }, [searchTerm, selectedPipeline]);

  const loadPipelines = async () => {
    try {
      const response = await axiosInstance.get('/api/sales/pipelines');
      setPipelines(response.data.pipelines);
      
      // Set default pipeline
      const defaultPipeline = response.data.pipelines.find((p: Pipeline) => p.is_default) || response.data.pipelines[0];
      setSelectedPipeline(defaultPipeline);
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  const loadOpportunities = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPipeline) params.append('pipeline_id', selectedPipeline.id.toString());

      const response = await axiosInstance.get(`/api/sales/opportunities?${params}`);
      setOpportunities(response.data.opportunities);
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        current_page: response.data.current_page
      });
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunity Pipeline"
        subtitle="Manage and track your sales opportunities"
        icon={FunnelIcon}
        action={{
          label: 'Add New Opportunity',
          href: '/sales/opportunities/new',
          icon: PlusIcon
        }}
      />

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Pipeline Selector */}
            <div className="min-w-48">
              <select
                value={selectedPipeline?.id || ''}
                onChange={(e) => {
                  const pipeline = pipelines.find(p => p.id === parseInt(e.target.value));
                  setSelectedPipeline(pipeline || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative min-w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {pagination.total} opportunities
            </span>
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {opportunity.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {opportunity.opportunity_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.customer_name || opportunity.lead_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: opportunity.stage_color }}
                      />
                      <span className="text-sm text-gray-900">
                        {opportunity.stage_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatRupiah(opportunity.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.probability}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.expected_close_date 
                      ? new Date(opportunity.expected_close_date).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.assigned_user_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/sales/opportunities/${opportunity.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {opportunities.length === 0 && (
          <div className="text-center py-12">
            <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first opportunity.
            </p>
            <div className="mt-6">
              <Link
                to="/app/sales/opportunities/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add New Opportunity
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityList;
