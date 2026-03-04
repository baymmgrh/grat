import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import PageHeader from '../../components/Layout/PageHeader';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import axiosInstance from '../../utils/axiosConfig';
interface Lead {
  id: number;
  lead_number: string;
  company_name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  lead_source: string;
  lead_status: string;
  lead_score: number;
  industry?: string;
  company_size?: string;
  budget?: number;
  assigned_to?: number;
  assigned_user_name?: string;
  created_at: string;
  last_contacted?: string;
  next_followup?: string;
}

const LeadList: React.FC = () => {
  const { t } = useLanguage();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'converted', label: 'Converted' },
    { value: 'lost', label: 'Lost' }
  ];

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'trade_show', label: 'Trade Show' },
    { value: 'advertisement', label: 'Advertisement' }
  ];

  const loadLeads = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const response = await axiosInstance.get(`/api/sales/leads?${params}`);
      setLeads(response.data.leads);
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        current_page: response.data.current_page
      });
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [searchTerm, statusFilter, sourceFilter]);

  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-green-100 text-green-800',
      'converted': 'bg-purple-100 text-purple-800',
      'lost': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website':
        return '🌐';
      case 'referral':
        return '👥';
      case 'cold_call':
        return '📞';
      case 'social_media':
        return '📱';
      case 'trade_show':
        return '🏢';
      case 'advertisement':
        return '📺';
      default:
        return '📋';
    }
  };

  const renderLeadScore = (score: number) => {
    const stars = Math.floor(score / 20); // Convert to 1-5 stars
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          i < stars ? (
            <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={i} className="h-4 w-4 text-gray-300" />
          )
        ))}
        <span className="ml-1 text-sm text-gray-600">({score})</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Management"
        subtitle="Manage and track your sales leads"
        icon={UserGroupIcon}
        action={{
          label: 'Add New Lead',
          href: '/sales/leads/new',
          icon: PlusIcon
        }}
      />

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status FunnelIcon */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source FunnelIcon */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {sourceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">{pagination.total}</span>
            <span className="ml-1">leads found</span>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {lead.company_name}
                  </h3>
                  <p className="text-sm text-gray-600">{lead.contact_person}</p>
                  <p className="text-xs text-gray-500 mt-1">{lead.lead_number}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getSourceIcon(lead.lead_source)}</span>
                  <Link
                    to={`/sales/leads/${lead.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              {/* Status & Score */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.lead_status)}`}>
                  {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                </span>
                {renderLeadScore(lead.lead_score)}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {lead.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1 mb-4 text-sm text-gray-600">
                {lead.industry && (
                  <div>
                    <span className="text-gray-500">Industry:</span> {lead.industry}
                  </div>
                )}
                {lead.company_size && (
                  <div>
                    <span className="text-gray-500">Size:</span> {lead.company_size}
                  </div>
                )}
                {lead.budget && (
                  <div>
                    <span className="text-gray-500">Budget:</span> ${lead.budget.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Assignment */}
              {lead.assigned_user_name && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="text-gray-500">Assigned to:</span> {lead.assigned_user_name}
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                  {lead.next_followup && (
                    <span className="text-orange-600 font-medium">
                      Next: {new Date(lead.next_followup).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first lead.
          </p>
          <div className="mt-6">
            <Link
              to="/app/sales/leads/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add New Lead
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => loadLeads(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
            </button>
            <button
              onClick={() => loadLeads(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => loadLeads(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.current_page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;
