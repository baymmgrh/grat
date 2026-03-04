import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  UserIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
}

interface AuditFilters {
  user_id?: number;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

const AuditTrail: React.FC = () => {
  const { t } = useLanguage();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;

  // Load audit logs
  const loadAuditLogs = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        per_page: logsPerPage,
        ...filters
      };

      const response = await axiosInstance.get('/api/settings/audit-logs', { params });
      
      setAuditLogs(response.data?.logs || []);
      setTotalPages(response.data?.total_pages || 1);
      setTotalLogs(response.data?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadAuditLogs(1);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Export audit logs
  const exportLogs = async () => {
    try {
      const response = await axiosInstance.get('/api/settings/audit-logs/export', {
        params: filters,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export audit logs');
    }
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'update':
        return <CogIcon className="h-5 w-5 text-blue-500" />;
      case 'delete':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'login':
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{t('common.success')}</span>;
      case 'failed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      case 'warning':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Warning</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading audit trail...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Audit Trail
            </h1>
            <p className="text-gray-600">
              Track all system activities and changes
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
            </button>
            
            <button
              onClick={exportLogs}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />{t('common.export')}</button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">FunnelIcon Audit Logs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filters.action || ''}
                onChange={(e) => setFilters({...filters, action: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Actions</option>
                <option value="create">{t('common.create')}</option>
                <option value="update">{t('common.update')}</option>
                <option value="delete">{t('common.delete')}</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="export">{t('common.export')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <select
                value={filters.resource_type || ''}
                onChange={(e) => setFilters({...filters, resource_type: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Resources</option>
                <option value="user">User</option>
                <option value="role">Role</option>
                <option value="product">{t('production.product')}</option>
                <option value="order">Order</option>
                <option value="inventory">Inventory</option>
                <option value="maintenance">{t('navigation.maintenance')}</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="success">{t('common.success')}</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={filters.start_date || ''}
                onChange={(e) => setFilters({...filters, start_date: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="datetime-local"
                value={filters.end_date || ''}
                onChange={(e) => setFilters({...filters, end_date: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Clear Filters
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalLogs.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Logs</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.status === 'success').length}
              </div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-500">Warnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{log.user_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.resource_type}</div>
                    <div className="text-sm text-gray-500">ID: {log.resource_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => loadAuditLogs(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
            </button>
            <button
              onClick={() => loadAuditLogs(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * logsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * logsPerPage, totalLogs)}
                </span>{' '}
                of <span className="font-medium">{totalLogs}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => loadAuditLogs(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                </button>
                <button
                  onClick={() => loadAuditLogs(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Log Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                    <div className="text-sm text-gray-900">{formatTimestamp(selectedLog.timestamp)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <div className="text-sm text-gray-900">{selectedLog.user_name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <div className="text-sm text-gray-900 capitalize">{selectedLog.action}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resource</label>
                    <div className="text-sm text-gray-900">{selectedLog.resource_type} (ID: {selectedLog.resource_id})</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('common.status')}</label>
                    <div>{getStatusBadge(selectedLog.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <div className="text-sm text-gray-900">{selectedLog.ip_address}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <div className="text-sm text-gray-900 break-all">{selectedLog.user_agent}</div>
                </div>

                {selectedLog.old_values && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Old Values</label>
                    <pre className="text-sm text-gray-900 bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Values</label>
                    <pre className="text-sm text-gray-900 bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
