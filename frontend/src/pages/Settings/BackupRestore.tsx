import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface BackupRecord {
  id: number;
  filename: string;
  size: number;
  created_at: string;
  backup_type: 'manual' | 'scheduled' | 'uploaded';
  status: 'completed' | 'failed' | 'in_progress';
  description?: string;
}

interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_time: string;
  retention_days: number;
  include_files: boolean;
  compress_backup: boolean;
}

const BackupRestore: React.FC = () => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    auto_backup_enabled: false,
    backup_frequency: 'daily',
    backup_time: '02:00',
    retention_days: 30,
    include_files: true,
    compress_backup: true
  });
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  // Load backup data
  const loadBackupData = async () => {
    try {
      setLoading(true);
      
      const [backupsRes, settingsRes] = await Promise.all([
        axiosInstance.get('/api/settings/backups').catch(() => ({ data: { backups: [] } })),
        axiosInstance.get('/api/settings/backup-config').catch(() => ({ data: { settings: {} } }))
      ]);

      setBackups(backupsRes.data?.backups || []);
      if (settingsRes.data?.settings) {
        setSettings(prev => ({ ...prev, ...settingsRes.data.settings }));
      }
    } catch (error) {
      console.error('Failed to load backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackupData();
  }, []);

  // Create manual backup
  const createBackup = async () => {
    if (!confirm('Create a new backup? This may take several minutes.')) {
      return;
    }

    try {
      setBackupInProgress(true);
      
      const response = await axiosInstance.post('/api/settings/backups/create', {
        description: `Manual backup created on ${new Date().toLocaleString()}`
      });

      await loadBackupData();
      toast.success('Backup created successfully!');
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      toast.error(error.response?.data?.error || 'Failed to create backup');
    } finally {
      setBackupInProgress(false);
    }
  };

  // Restore from backup
  const restoreBackup = async (backupId: number, filename: string) => {
    if (!confirm(`⚠️ RESTORE FROM BACKUP\n\nFile: ${filename}\n\nThis will:\n• Overwrite ALL current data\n• Cannot be undone\n• A pre-restore backup will be created\n\nAre you sure you want to continue?`)) {
      return;
    }

    try {
      setRestoreInProgress(true);
      
      const response = await axiosInstance.post(`/api/settings/backups/${backupId}/restore`);

      toast.success('Backup restored successfully! Please restart the application.');
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to restore backup:', error);
      toast.error(error.response?.data?.error || 'Failed to restore backup');
    } finally {
      setRestoreInProgress(false);
    }
  };

  // Download backup
  const downloadBackup = async (backupId: number, filename: string) => {
    try {
      toast.loading('Preparing download...');
      
      const response = await axiosInstance.get(`/api/settings/backups/${backupId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Download started!');
    } catch (error: any) {
      toast.dismiss();
      console.error('Failed to download backup:', error);
      toast.error('Failed to download backup');
    }
  };

  // Upload backup file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.db', '.zip'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error('Invalid file type. Only .db and .zip files are allowed.');
      return;
    }

    try {
      setUploadInProgress(true);
      
      const formData = new FormData();
      formData.append('file', file);

      await axiosInstance.post('/api/settings/backups/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await loadBackupData();
      toast.success('Backup file uploaded successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Failed to upload backup:', error);
      toast.error(error.response?.data?.error || 'Failed to upload backup');
    } finally {
      setUploadInProgress(false);
    }
  };

  // Delete backup
  const deleteBackup = async (backupId: number) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/settings/backups/${backupId}`);
      await loadBackupData();
      toast.success('Backup deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete backup:', error);
      toast.error(error.response?.data?.error || 'Failed to delete backup');
    }
  };

  // Save backup settings
  const saveSettings = async () => {
    try {
      await axiosInstance.post('/api/settings/backup-config', settings);
      toast.success('Backup settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save backup settings');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'failed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      case 'in_progress':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">In Progress</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading backup data...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Backup & Restore
        </h1>
        <p className="text-gray-600">
          Manage system backups and restore points
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Backup Actions */}
        <div className="lg:col-span-2">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={createBackup}
                disabled={backupInProgress || restoreInProgress}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {backupInProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Create Backup Now
                  </>
                )}
              </button>
              
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".db,.zip"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileUpload}
                  disabled={uploadInProgress || restoreInProgress}
                />
                <button
                  disabled={uploadInProgress || restoreInProgress}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                      Upload Backup File
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: .db (SQLite database), .zip (compressed backup)
            </p>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Backup Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.size')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{backup.filename}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(backup.created_at).toLocaleString()} 
                            <span className="ml-2 capitalize">({backup.backup_type})</span>
                          </div>
                          {backup.description && (
                            <div className="text-xs text-gray-400 mt-1">{backup.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(backup.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {backup.status === 'completed' && (
                            <>
                              <button
                                onClick={() => restoreBackup(backup.id, backup.filename)}
                                className="text-green-600 hover:text-green-900"
                                title="Restore"
                              >
                                <PlayIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadBackup(backup.id, backup.filename)}
                                className="text-blue-600 hover:text-blue-900"
                                title="ArrowDownTrayIcon"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('common.delete')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {backups.length === 0 && (
                <div className="text-center py-12">
                  <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No backups found</h3>
                  <p className="text-gray-500">Create your first backup to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.auto_backup_enabled}
                    onChange={(e) => setSettings({...settings, auto_backup_enabled: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable Automatic Backups</span>
                </label>
              </div>

              {settings.auto_backup_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={settings.backup_frequency}
                      onChange={(e) => setSettings({...settings, backup_frequency: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Time</label>
                    <input
                      type="time"
                      value={settings.backup_time}
                      onChange={(e) => setSettings({...settings, backup_time: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retention (days)</label>
                <input
                  type="number"
                  value={settings.retention_days}
                  onChange={(e) => setSettings({...settings, retention_days: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">Backups older than this will be automatically deleted</p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.include_files}
                    onChange={(e) => setSettings({...settings, include_files: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include uploaded files</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.compress_backup}
                    onChange={(e) => setSettings({...settings, compress_backup: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Compress backups</span>
                </label>
              </div>

              <button
                onClick={saveSettings}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>

          {/* Backup Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-900">Backup Information</h3>
            </div>
            <div className="mt-2 text-sm text-blue-800">
              <ul className="space-y-1">
                <li>• Backups include all database data</li>
                <li>• File backups include uploaded documents</li>
                <li>• Compressed backups save storage space</li>
                <li>• Always test restore procedures</li>
                <li>• Store backups in multiple locations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
