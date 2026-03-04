import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LinkIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon
,
  PlusIcon,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface ExternalConnector {
  id: number;
  name: string;
  type: string;
  endpoint_url: string;
  api_key?: string;
  username?: string;
  password?: string;
  is_active: boolean;
  last_sync?: string;
  sync_status: 'success' | 'failed' | 'pending' | 'never';
  error_message?: string;
  config: any;
  created_at: string;
}

const ExternalConnectors: React.FC = () => {
  const { t } = useLanguage();

  const [connectors, setConnectors] = useState<ExternalConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ExternalConnector | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'rest_api',
    endpoint_url: '',
    api_key: '',
    username: '',
    password: '',
    is_active: true,
    config: {}
  });

  const connectorTypes = [
    { value: 'rest_api', label: 'REST API', description: 'Standard REST API integration' },
    { value: 'soap', label: 'SOAP', description: 'SOAP web service integration' },
    { value: 'database', label: 'Database', description: 'Direct database connection' },
    { value: 'ftp', label: 'FTP/SFTP', description: 'File transfer protocol' },
    { value: 'email', label: 'Email', description: 'Email service integration' },
    { value: 'erp', label: 'ERP System', description: 'External ERP system' },
    { value: 'crm', label: 'CRM System', description: 'Customer relationship management' },
    { value: 'accounting', label: 'Accounting', description: 'Accounting software integration' }
  ];

  // Load connectors
  const loadConnectors = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/integration/connectors');
      setConnectors(response.data?.connectors || []);
    } catch (error) {
      console.error('Failed to load connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectors();
  }, []);

  // Save connector
  const saveConnector = async () => {
    try {
      if (editingConnector) {
        await axiosInstance.put(`/api/integration/connectors/${editingConnector.id}`, formData);
      } else {
        await axiosInstance.post('/api/integration/connectors', formData);
      }

      setShowModal(false);
      setEditingConnector(null);
      setFormData({
        name: '',
        type: 'rest_api',
        endpoint_url: '',
        api_key: '',
        username: '',
        password: '',
        is_active: true,
        config: {}
      });
      
      await loadConnectors();
      alert(`Connector ${editingConnector ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Failed to save connector:', error);
      alert('Failed to save connector');
    }
  };

  // Test connection
  const testConnection = async (connectorId: number) => {
    try {
      const response = await axiosInstance.post(`/api/integration/connectors/${connectorId}/test`);
      
      if (response.data?.success) {
        alert('Connection test successful!');
      } else {
        alert(`Connection test failed: ${response.data?.error || 'Unknown error'}`);
      }
      
      await loadConnectors();
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Connection test failed');
    }
  };

  // Toggle connector status
  const toggleConnector = async (connectorId: number, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/api/integration/connectors/${connectorId}`, {
        is_active: !isActive
      });
      
      await loadConnectors();
    } catch (error) {
      console.error('Failed to toggle connector:', error);
      alert('Failed to update connector status');
    }
  };

  // Delete connector
  const deleteConnector = async (connectorId: number) => {
    if (!confirm('Are you sure you want to delete this connector?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/integration/connectors/${connectorId}`);
      await loadConnectors();
      alert('Connector deleted successfully!');
    } catch (error) {
      console.error('Failed to delete connector:', error);
      alert('Failed to delete connector');
    }
  };

  // Edit connector
  const editConnector = (connector: ExternalConnector) => {
    setEditingConnector(connector);
    setFormData({
      name: connector.name,
      type: connector.type,
      endpoint_url: connector.endpoint_url,
      api_key: connector.api_key || '',
      username: connector.username || '',
      password: '', // Don't populate password for security
      is_active: connector.is_active,
      config: connector.config || {}
    });
    setShowModal(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Connected</span>;
      case 'failed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      case 'pending':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Never Tested</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading external connectors...</span>
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
              External System Connectors
            </h1>
            <p className="text-gray-600">
              Manage connections to external systems and APIs
            </p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Connector
          </button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((connector) => (
          <div key={connector.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Link className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">{connector.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{connector.type.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {connector.is_active ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 break-all">{connector.endpoint_url}</div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status:</span>
                {getStatusBadge(connector.sync_status)}
              </div>
              
              {connector.last_sync && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-500">Last Sync:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(connector.last_sync).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {connector.error_message && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-700">{connector.error_message}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => testConnection(connector.id)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
              </button>
              
              <button
                onClick={() => toggleConnector(connector.id, connector.is_active)}
                className={`flex items-center justify-center px-3 py-2 rounded ${
                  connector.is_active 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {connector.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              </button>
              
              <button
                onClick={() => editConnector(connector)}
                className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => deleteConnector(connector.id)}
                className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {connectors.length === 0 && (
        <div className="text-center py-12">
          <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No external connectors</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first external system connector.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Connector
          </button>
        </div>
      )}

      {/* Connector Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConnector ? 'Edit Connector' : 'Add New Connector'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Connector Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., SAP Integration"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Connector Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {connectorTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Endpoint URL</label>
                  <input
                    type="url"
                    value={formData.endpoint_url}
                    onChange={(e) => setFormData({...formData, endpoint_url: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://api.example.com/v1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">API KeyIcon</label>
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder={editingConnector ? "Leave blank to keep current password" : "Optional"}
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active Connector</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingConnector(null);
                    setFormData({
                      name: '',
                      type: 'rest_api',
                      endpoint_url: '',
                      api_key: '',
                      username: '',
                      password: '',
                      is_active: true,
                      config: {}
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >{t('common.cancel')}</button>
                <button
                  onClick={saveConnector}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingConnector ? 'Update Connector' : 'Create Connector'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalConnectors;
