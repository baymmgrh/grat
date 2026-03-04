import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon
,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface SyncJob {
  id: number;
  name: string;
  source_system: string;
  target_system: string;
  sync_type: 'full' | 'incremental';
  schedule: string;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  records_synced: number;
  error_message?: string;
}

const DataSynchronization: React.FC = () => {
  const { t } = useLanguage();

  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState<Set<number>>(new Set());

  const loadSyncJobs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/integration/data-sync/jobs');
      setSyncJobs(response.data?.jobs || []);
    } catch (error) {
      console.error('Failed to load sync jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyncJobs();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(loadSyncJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const runSyncJob = async (jobId: number) => {
    try {
      setRunningJobs(prev => new Set(prev).add(jobId));
      
      await axiosInstance.post(`/api/integration/data-sync/jobs/${jobId}/run`);
      
      // Refresh data after a short delay
      setTimeout(loadSyncJobs, 2000);
    } catch (error) {
      console.error('Failed to run sync job:', error);
      alert('Failed to start sync job');
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const toggleSyncJob = async (jobId: number, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/api/integration/data-sync/jobs/${jobId}`, {
        is_active: !isActive
      });
      
      await loadSyncJobs();
    } catch (error) {
      console.error('Failed to toggle sync job:', error);
      alert('Failed to update sync job status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{t('common.success')}</span>;
      case 'failed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      case 'running':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Running</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading data synchronization...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Synchronization
        </h1>
        <p className="text-gray-600">
          Manage data synchronization between systems
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ArrowPathIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{syncJobs.length}</div>
              <div className="text-sm text-gray-500">Total Jobs</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {syncJobs.filter(job => job.status === 'success').length}
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
                {syncJobs.filter(job => job.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {syncJobs.filter(job => job.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Jobs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Synchronization Jobs</h2>
        </div>

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
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncJobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{job.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{job.sync_type} sync</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {job.source_system} → {job.target_system}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.schedule}</div>
                    {job.next_run && (
                      <div className="text-sm text-gray-500">
                        Next: {new Date(job.next_run).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.last_run ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(job.last_run).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.records_synced} records
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(job.status)}
                      {job.error_message && (
                        <div className="text-xs text-red-600" title={job.error_message}>
                          Error: {job.error_message.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => runSyncJob(job.id)}
                        disabled={runningJobs.has(job.id) || job.status === 'running'}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        title="Run Now"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => toggleSyncJob(job.id, job.is_active)}
                        className={`${job.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        title={job.is_active ? 'Disable' : 'Enable'}
                      >
                        {job.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Configure"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {syncJobs.length === 0 && (
            <div className="text-center py-12">
              <ArrowPathIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sync jobs configured</h3>
              <p className="text-gray-500">Configure data synchronization jobs to keep systems in sync.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-blue-900">Synchronization Information</h3>
        </div>
        <div className="mt-2 text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• Full sync: Synchronizes all data from source to target</li>
            <li>• Incremental sync: Only synchronizes changed data since last run</li>
            <li>• Jobs run automatically based on configured schedule</li>
            <li>• Monitor sync status and resolve conflicts promptly</li>
            <li>• Test sync jobs in development before production use</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataSynchronization;
