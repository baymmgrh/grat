import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  status: string;
  timestamp: string;
  duration_ms: number;
}

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceId?: string | number;
  title?: string;
}

const ACTION_ICONS: { [key: string]: React.ReactNode } = {
  create: <PlusCircleIcon className="h-4 w-4 text-green-500" />,
  update: <PencilSquareIcon className="h-4 w-4 text-blue-500" />,
  delete: <TrashIcon className="h-4 w-4 text-red-500" />,
  read: <EyeIcon className="h-4 w-4 text-gray-500" />,
  login: <ArrowRightOnRectangleIcon className="h-4 w-4 text-emerald-500" />,
  logout: <ArrowLeftOnRectangleIcon className="h-4 w-4 text-orange-500" />,
};

const ACTION_LABELS: { [key: string]: string } = {
  create: 'Dibuat',
  update: 'Diupdate',
  delete: 'Dihapus',
  read: 'Dilihat',
  login: 'Login',
  logout: 'Logout',
};

const ACTION_COLORS: { [key: string]: string } = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  read: 'bg-gray-100 text-gray-700',
  login: 'bg-emerald-100 text-emerald-700',
  logout: 'bg-orange-100 text-orange-700',
};

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  title = 'Log Aktivitas',
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, page, actionFilter, resourceType, resourceId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });
      
      // Handle resource type - backend logs as 'production' for work orders
      if (resourceType === 'work_order') {
        params.append('resource_type', 'production');
        // Filter by URL pattern for work orders
        params.append('url_contains', 'work-orders');
      } else if (resourceType === 'machine') {
        params.append('resource_type', 'production');
        params.append('url_contains', 'machines');
      } else {
        params.append('resource_type', resourceType);
      }
      
      if (resourceId) {
        params.append('resource_id', resourceId.toString());
      }
      if (actionFilter) {
        params.append('action', actionFilter);
      }
      
      // Exclude view/read actions by default for cleaner logs
      if (!actionFilter) {
        params.append('exclude_actions', 'view,list');
      }

      const response = await axiosInstance.get(`/api/settings/audit-logs?${params}`);
      setLogs(response.data.logs || []);
      setTotalPages(response.data.total_pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null;
    
    const changes: { field: string; old: any; new: any }[] = [];
    
    try {
      const oldObj = typeof oldValues === 'string' ? JSON.parse(oldValues) : oldValues || {};
      const newObj = typeof newValues === 'string' ? JSON.parse(newValues) : newValues || {};
      
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
      
      allKeys.forEach((key) => {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push({
            field: key,
            old: oldObj[key],
            new: newObj[key],
          });
        }
      });
    } catch (e) {
      return null;
    }
    
    return changes.length > 0 ? changes : null;
  };

  const formatInputData = (newValues: any) => {
    if (!newValues) return null;
    
    try {
      const data = typeof newValues === 'string' ? JSON.parse(newValues) : newValues;
      if (!data || typeof data !== 'object') return null;
      
      // Filter out sensitive or internal fields
      const excludeFields = ['password', 'token', 'secret', '_sa_instance_state'];
      const entries = Object.entries(data).filter(([key]) => !excludeFields.includes(key));
      
      return entries.length > 0 ? entries : null;
    } catch (e) {
      return null;
    }
  };

  const formatFieldLabel = (field: string) => {
    // Convert snake_case or camelCase to readable label
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `[${value.length} items]` : '[]';
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-slate-300 text-sm">
                  {resourceType} {resourceId ? `#${resourceId}` : ''} • {total} aktivitas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Aksi</option>
              <option value="create">Dibuat</option>
              <option value="update">Diupdate</option>
              <option value="delete">Dihapus</option>
            </select>
          </div>
          <button
            onClick={fetchLogs}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada log aktivitas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const changes = formatChanges(log.old_values, log.new_values);
                const inputData = formatInputData(log.new_values);
                const isExpanded = expandedLog === log.id;
                const hasDetails = (changes && changes.length > 0) || (inputData && inputData.length > 0);
                
                return (
                  <div
                    key={log.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`p-2 rounded-lg ${ACTION_COLORS[log.action] || 'bg-gray-100'}`}>
                          {ACTION_ICONS[log.action] || <DocumentTextIcon className="h-4 w-4" />}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header with action and resource */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          {log.resource_name && (
                            <span className="text-sm font-medium text-gray-800">
                              {log.resource_name}
                            </span>
                          )}
                          {log.resource_id && (
                            <span className="text-xs text-gray-500">
                              (ID: {log.resource_id})
                            </span>
                          )}
                          {log.status !== 'success' && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              {log.status}
                            </span>
                          )}
                        </div>
                        
                        {/* User info - more prominent */}
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg inline-flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            {log.user_name || 'System'}
                          </span>
                          <span className="text-xs text-blue-600">•</span>
                          <span className="text-xs text-blue-600">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {log.ip_address && (
                            <>
                              <span className="text-xs text-blue-600">•</span>
                              <span className="text-xs text-blue-500">{log.ip_address}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Details toggle */}
                        {hasDetails && (
                          <div className="mt-2">
                            <button
                              onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? '▼ Sembunyikan detail' : '▶ Lihat detail data yang diinput'}
                            </button>
                            
                            {isExpanded && (
                              <div className="mt-2 bg-gray-50 rounded-lg p-4 text-sm">
                                {/* For update action - show changes */}
                                {log.action === 'update' && changes && changes.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Perubahan Data:</h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-gray-100">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-600">Field</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-600">Nilai Lama</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-600">Nilai Baru</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {changes.map((change, idx) => (
                                            <tr key={idx} className="border-t border-gray-200">
                                              <td className="py-2 px-3 font-medium text-gray-700">
                                                {formatFieldLabel(change.field)}
                                              </td>
                                              <td className="py-2 px-3 text-red-600 bg-red-50">
                                                {formatValue(change.old)}
                                              </td>
                                              <td className="py-2 px-3 text-green-600 bg-green-50">
                                                {formatValue(change.new)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                                
                                {/* For create action - show all input data */}
                                {log.action === 'create' && inputData && inputData.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Data yang Diinput:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {inputData.map(([key, value], idx) => (
                                        <div key={idx} className="flex items-start gap-2 py-1 px-2 bg-white rounded border">
                                          <span className="font-medium text-gray-600 text-xs min-w-[100px]">
                                            {formatFieldLabel(key)}:
                                          </span>
                                          <span className="text-gray-800 text-xs break-all">
                                            {formatValue(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* For other actions - show new_values if available */}
                                {log.action !== 'create' && log.action !== 'update' && inputData && inputData.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Data:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {inputData.map(([key, value], idx) => (
                                        <div key={idx} className="flex items-start gap-2 py-1 px-2 bg-white rounded border">
                                          <span className="font-medium text-gray-600 text-xs min-w-[100px]">
                                            {formatFieldLabel(key)}:
                                          </span>
                                          <span className="text-gray-800 text-xs break-all">
                                            {formatValue(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogModal;
