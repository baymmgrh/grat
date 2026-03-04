import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  KeyIcon,
  PauseIcon,
  PlayIcon
,
  PlusIcon,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key?: string;
  retry_count: number;
  timeout_seconds: number;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
  created_at: string;
}

const WebhookManagement: React.FC = () => {
  const { t } = useLanguage();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    is_active: true,
    secret_key: '',
    retry_count: 3,
    timeout_seconds: 30
  });

  const availableEvents = [
    'user.created', 'user.updated', 'user.deleted',
    'order.created', 'order.updated', 'order.completed',
    'product.created', 'product.updated', 'product.deleted',
    'inventory.low_stock', 'inventory.updated',
    'maintenance.scheduled', 'maintenance.completed',
    'quality.test_failed', 'quality.alert_created'
  ];

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/integration/webhooks');
      setWebhooks(response.data?.webhooks || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const saveWebhook = async () => {
    try {
      await axiosInstance.post('/api/integration/webhooks', formData);
      setShowModal(false);
      setFormData({
        name: '',
        url: '',
        events: [],
        is_active: true,
        secret_key: '',
        retry_count: 3,
        timeout_seconds: 30
      });
      await loadWebhooks();
      alert('Webhook created successfully!');
    } catch (error) {
      console.error('Failed to save webhook:', error);
      alert('Failed to save webhook');
    }
  };

  const testWebhook = async (webhookId: number) => {
    try {
      const response = await axiosInstance.post(`/api/integration/webhooks/${webhookId}/test`);
      
      if (response.data?.success) {
        alert('Webhook test successful!');
      } else {
        alert(`Webhook test failed: ${response.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      alert('Webhook test failed');
    }
  };

  const toggleWebhook = async (webhookId: number, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/api/integration/webhooks/${webhookId}`, {
        is_active: !isActive
      });
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      alert('Failed to update webhook status');
    }
  };

  const deleteWebhook = async (webhookId: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/integration/webhooks/${webhookId}`);
      await loadWebhooks();
      alert('Webhook deleted successfully!');
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading webhooks...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Webhook Management
            </h1>
            <p className="text-gray-600">
              Manage webhook endpoints and event notifications
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Webhook
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <BoltIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{webhooks.length}</div>
              <div className="text-sm text-gray-500">Total Webhooks</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {webhooks.reduce((sum, w) => sum + w.success_count, 0)}
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
                {webhooks.reduce((sum, w) => sum + w.failure_count, 0)}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {webhooks.filter(w => w.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <BoltIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                  <p className="text-sm text-gray-500 break-all">{webhook.url}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {webhook.is_active ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Events:</div>
              <div className="flex flex-wrap gap-1">
                {webhook.events.slice(0, 3).map((event) => (
                  <span
                    key={event}
                    className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {event}
                  </span>
                ))}
                {webhook.events.length > 3 && (
                  <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{webhook.events.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">{t('common.success')}</div>
                <div className="font-medium text-green-600">{webhook.success_count}</div>
              </div>
              <div>
                <div className="text-gray-500">Failed</div>
                <div className="font-medium text-red-600">{webhook.failure_count}</div>
              </div>
            </div>

            {webhook.last_triggered && (
              <div className="mb-4 text-sm">
                <div className="text-gray-500">Last Triggered:</div>
                <div className="text-gray-900">
                  {new Date(webhook.last_triggered).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => testWebhook(webhook.id)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
              </button>
              
              <button
                onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                className={`flex items-center justify-center px-3 py-2 rounded ${
                  webhook.is_active 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {webhook.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              </button>
              
              <button
                className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => deleteWebhook(webhook.id)}
                className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {webhooks.length === 0 && (
        <div className="text-center py-12">
          <BoltIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
          <p className="text-gray-500 mb-4">Create webhooks to receive real-time event notifications.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Webhook
          </button>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Webhook</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Order Notifications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="https://your-app.com/webhooks/orders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events to Subscribe</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              events: [...formData.events, event]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              events: formData.events.filter(e => e !== event)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secret KeyIcon</label>
                  <input
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) => setFormData({...formData, secret_key: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeout (seconds)</label>
                  <input
                    type="number"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({...formData, timeout_seconds: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="5"
                    max="300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Retry Count</label>
                <input
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => setFormData({...formData, retry_count: parseInt(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                  max="10"
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
                  <span className="text-sm text-gray-700">Active Webhook</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >{t('common.cancel')}</button>
              <button
                onClick={saveWebhook}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagement;
