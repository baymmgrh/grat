import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  EyeIcon,
  GlobeAltIcon,
  KeyIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon
,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface APIEndpoint {
  id: number;
  path: string;
  method: string;
  description: string;
  is_active: boolean;
  rate_limit: number;
  auth_required: boolean;
  roles_allowed: string[];
  request_count: number;
  last_accessed?: string;
}

const APIGateway: React.FC = () => {
  const { t } = useLanguage();

  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    path: '',
    method: 'GET',
    description: '',
    is_active: true,
    rate_limit: 100,
    auth_required: true,
    roles_allowed: []
  });

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/integration/api-gateway/endpoints');
      setEndpoints(response.data?.endpoints || []);
    } catch (error) {
      console.error('Failed to load API endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEndpoints();
  }, []);

  const saveEndpoint = async () => {
    try {
      await axiosInstance.post('/api/integration/api-gateway/endpoints', formData);
      setShowModal(false);
      setFormData({
        path: '',
        method: 'GET', 
        description: '',
        is_active: true,
        rate_limit: 100,
        auth_required: true,
        roles_allowed: []
      });
      await loadEndpoints();
      alert('API endpoint created successfully!');
    } catch (error) {
      console.error('Failed to save endpoint:', error);
      alert('Failed to save endpoint');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading API Gateway...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Gateway</h1>
            <p className="text-gray-600">Manage API endpoints and access control</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Endpoint
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <GlobeAltIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{endpoints.length}</div>
              <div className="text-sm text-gray-500">Total Endpoints</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {endpoints.reduce((sum, e) => sum + e.request_count, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {endpoints.filter(e => e.auth_required).length}
              </div>
              <div className="text-sm text-gray-500">Secured</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <KeyIcon className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {endpoints.filter(e => e.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {endpoints.map((endpoint) => (
              <tr key={endpoint.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{endpoint.path}</div>
                    <div className="text-sm text-gray-500">{endpoint.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    endpoint.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{endpoint.request_count}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Endpoint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add API Endpoint</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Path</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({...formData, path: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="/api/custom/endpoint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('common.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rate Limit (per hour)</label>
                <input
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData({...formData, rate_limit: parseInt(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auth_required}
                    onChange={(e) => setFormData({...formData, auth_required: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Require Authentication</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active Endpoint</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >{t('common.cancel')}</button>
              <button
                onClick={saveEndpoint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIGateway;
