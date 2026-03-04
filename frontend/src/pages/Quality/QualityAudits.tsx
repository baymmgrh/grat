import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetQualityAuditsQuery } from '../../services/api';
import {
  AcademicCapIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
interface QualityAudit {
  id: number;
  audit_number: string;
  audit_type: string;
  audit_scope: string;
  planned_date: string;
  actual_date?: string;
  duration_hours?: number;
  lead_auditor: string;
  status: string;
  overall_rating?: string;
  total_findings: number;
  critical_findings: number;
  major_findings: number;
  minor_findings: number;
  observations: number;
  follow_up_date?: string;
  closure_date?: string;
}

export default function QualityAudits() {
    const { t } = useLanguage();

const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showNewAuditForm, setShowNewAuditForm] = useState(false);

  const { data: auditsData, isLoading } = useGetQualityAuditsQuery({ 
    status: statusFilter,
    audit_type: typeFilter 
  });

  const audits = auditsData?.audits || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'satisfactory': return 'text-yellow-600';
      case 'needs_improvement': return 'text-orange-600';
      case 'unsatisfactory': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internal': return <AcademicCapIcon className="h-5 w-5 text-blue-500" />;
      case 'external': return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case 'supplier': return <UserIcon className="h-5 w-5 text-purple-500" />;
      case 'customer': return <CheckCircleIcon className="h-5 w-5 text-orange-500" />;
      default: return <AcademicCapIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayAudits = audits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Audits</h1>
          <p className="text-gray-600">Plan, conduct, and track quality audits</p>
        </div>
        <button
          onClick={() => setShowNewAuditForm(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Audit
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{displayAudits.length}</p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {displayAudits.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {displayAudits.filter(a => a.status === 'in_progress').length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Findings</p>
              <p className="text-2xl font-bold text-red-600">
                {displayAudits.reduce((sum, a) => sum + a.critical_findings, 0)}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="supplier">Supplier</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Audit Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Auditor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayAudits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(audit.audit_type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {audit.audit_number}
                        </div>
                        {audit.overall_rating && (
                          <div className={`text-sm ${getRatingColor(audit.overall_rating)}`}>
                            {audit.overall_rating.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {audit.audit_type.charAt(0).toUpperCase() + audit.audit_type.slice(1)}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {audit.audit_scope}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        {new Date(audit.planned_date).toLocaleDateString('id-ID')}
                      </div>
                      {audit.actual_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Actual: {new Date(audit.actual_date).toLocaleDateString('id-ID')}
                        </div>
                      )}
                      {audit.duration_hours && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <ClockIcon className="h-3 w-3" />
                          {audit.duration_hours}h
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{audit.lead_auditor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(audit.status)}`}>
                      {audit.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-4">
                        {audit.critical_findings > 0 && (
                          <span className="text-red-600 font-medium">
                            {audit.critical_findings} Critical
                          </span>
                        )}
                        {audit.major_findings > 0 && (
                          <span className="text-orange-600">
                            {audit.major_findings} Major
                          </span>
                        )}
                        {audit.minor_findings > 0 && (
                          <span className="text-yellow-600">
                            {audit.minor_findings} Minor
                          </span>
                        )}
                        {audit.total_findings === 0 && audit.status === 'completed' && (
                          <span className="text-green-600">No findings</span>
                        )}
                      </div>
                      {audit.observations > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {audit.observations} observations
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Audit Form Modal */}
      {showNewAuditForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Audit</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit Type</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>Internal</option>
                    <option>External</option>
                    <option>Supplier</option>
                    <option>Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit Scope</label>
                  <textarea 
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe the audit scope..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Planned Date</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lead Auditor</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>John Smith</option>
                    <option>Sarah Johnson</option>
                    <option>Mike Wilson</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewAuditForm(false)}
                    className="btn-secondary"
                  >{t('common.cancel')}</button>
                  <button
                    type="submit"
                    className="btn-primary"
                    onClick={() => setShowNewAuditForm(false)}
                  >
                    Schedule Audit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
