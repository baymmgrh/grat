import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

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

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  conversion_rate: number;
}

const LeadListUpgraded: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showActions, setShowActions] = useState<number | null>(null);
  const [stats, setStats] = useState<LeadStats>({
    total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0, conversion_rate: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1
  });

  const statusOptions = [
    { value: '', label: 'All Status', color: 'gray' },
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'contacted', label: 'Contacted', color: 'yellow' },
    { value: 'qualified', label: 'Qualified', color: 'green' },
    { value: 'converted', label: 'Converted', color: 'purple' },
    { value: 'lost', label: 'Lost', color: 'red' }
  ];

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'website', label: 'Website', icon: '🌐' },
    { value: 'referral', label: 'Referral', icon: '👥' },
    { value: 'cold_call', label: 'Cold Call', icon: '📞' },
    { value: 'social_media', label: 'Social Media', icon: '📱' },
    { value: 'trade_show', label: 'Trade Show', icon: '🏢' },
    { value: 'advertisement', label: 'Advertisement', icon: '📺' }
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
      setLeads(response.data.leads || []);
      setPagination({
        total: response.data.total || 0,
        pages: response.data.pages || 0,
        current_page: response.data.current_page || 1
      });

      // Calculate stats
      const allLeads = response.data.leads || [];
      const newStats = {
        total: response.data.total || allLeads.length,
        new: allLeads.filter((l: Lead) => l.lead_status === 'new').length,
        contacted: allLeads.filter((l: Lead) => l.lead_status === 'contacted').length,
        qualified: allLeads.filter((l: Lead) => l.lead_status === 'qualified').length,
        converted: allLeads.filter((l: Lead) => l.lead_status === 'converted').length,
        lost: allLeads.filter((l: Lead) => l.lead_status === 'lost').length,
        conversion_rate: 0
      };
      newStats.conversion_rate = newStats.total > 0 
        ? Math.round((newStats.converted / newStats.total) * 100) 
        : 0;
      setStats(newStats);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [searchTerm, statusFilter, sourceFilter]);

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await axiosInstance.delete(`/api/sales/leads/${id}`);
      toast.success('Lead deleted successfully');
      loadLeads(pagination.current_page);
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleConvertToOpportunity = async (id: number) => {
    try {
      await axiosInstance.post(`/api/sales/leads/${id}/convert`);
      toast.success('Lead converted to opportunity');
      loadLeads(pagination.current_page);
    } catch (error) {
      toast.error('Failed to convert lead');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    try {
      await axiosInstance.post('/api/sales/leads/bulk-action', {
        action,
        lead_ids: selectedLeads
      });
      toast.success(`${action} completed for ${selectedLeads.length} leads`);
      setSelectedLeads([]);
      loadLeads(pagination.current_page);
    } catch (error) {
      toast.error(`Failed to ${action} leads`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800 border-blue-200',
      'contacted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'qualified': 'bg-green-100 text-green-800 border-green-200',
      'converted': 'bg-purple-100 text-purple-800 border-purple-200',
      'lost': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      'website': '🌐',
      'referral': '👥',
      'cold_call': '📞',
      'social_media': '📱',
      'trade_show': '🏢',
      'advertisement': '📺'
    };
    return icons[source] || '📋';
  };

  const renderLeadScore = (score: number) => {
    const stars = Math.floor(score / 20);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          i < stars ? (
            <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={i} className="h-4 w-4 text-gray-300" />
          )
        ))}
        <span className="ml-1 text-xs text-gray-500">({score})</span>
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading && leads.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8" />
              Lead Management
            </h1>
            <p className="text-blue-100 mt-1">Track and convert your sales leads</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadLeads(pagination.current_page)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <Link
              to="/app/sales/leads/new"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Lead
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Leads</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div className="text-sm text-blue-600">New</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          <div className="text-sm text-yellow-600">Contacted</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.qualified}</div>
          <div className="text-sm text-green-600">Qualified</div>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.converted}</div>
          <div className="text-sm text-purple-600">Converted</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          <div className="text-sm text-red-600">Lost</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
          <div className="text-sm text-green-100">Conversion Rate</div>
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
              placeholder="Search by company, contact, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon ? `${option.icon} ${option.label}` : option.label}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <Squares2X2Icon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <ListBulletIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">{selectedLeads.length} selected</span>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete Selected
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Leads Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSourceIcon(lead.lead_source)}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(lead.lead_status)}`}>
                        {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {lead.company_name}
                    </h3>
                    <p className="text-sm text-gray-600">{lead.contact_person}</p>
                    <p className="text-xs text-gray-400 mt-1">{lead.lead_number}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === lead.id ? null : lead.id)}
                      className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    {showActions === lead.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <Link
                          to={`/app/sales/leads/${lead.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit Lead
                        </Link>
                        <button
                          onClick={() => handleConvertToOpportunity(lead.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                        >
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                          Convert to Opportunity
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Lead Score */}
                <div className="mb-4">
                  {renderLeadScore(lead.lead_score)}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{lead.phone}</span>
                    </a>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  {lead.industry && (
                    <div>
                      <span className="text-gray-400 text-xs">Industry</span>
                      <p className="text-gray-700 font-medium">{lead.industry}</p>
                    </div>
                  )}
                  {lead.company_size && (
                    <div>
                      <span className="text-gray-400 text-xs">Size</span>
                      <p className="text-gray-700 font-medium">{lead.company_size}</p>
                    </div>
                  )}
                  {lead.budget && (
                    <div className="col-span-2">
                      <span className="text-gray-400 text-xs">Budget</span>
                      <p className="text-gray-700 font-medium">{formatCurrency(lead.budget)}</p>
                    </div>
                  )}
                </div>

                {/* Assignment */}
                {lead.assigned_user_name && (
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-blue-600">
                        {lead.assigned_user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{lead.assigned_user_name}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                  {lead.next_followup && (
                    <span className="flex items-center text-orange-600 font-medium">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {new Date(lead.next_followup).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leads Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads(leads.map(l => l.id));
                        } else {
                          setSelectedLeads([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{lead.company_name}</div>
                        <div className="text-sm text-gray-500">{lead.lead_number}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">{lead.contact_person}</div>
                        <div className="text-gray-500">{lead.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(lead.lead_status)}`}>
                        {lead.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {renderLeadScore(lead.lead_score)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center text-sm">
                        <span className="mr-1">{getSourceIcon(lead.lead_source)}</span>
                        {lead.lead_source}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {lead.budget ? formatCurrency(lead.budget) : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {lead.assigned_user_name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/sales/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/app/sales/leads/${lead.id}/edit`}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
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
      {leads.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No leads found</h3>
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
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-700">
            Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
            <span className="font-medium">{pagination.pages}</span> ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadLeads(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => loadLeads(pageNum)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    pageNum === pagination.current_page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => loadLeads(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadListUpgraded;
