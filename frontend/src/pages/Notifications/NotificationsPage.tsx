import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  notification_type: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  reference_type?: string;
  reference_id?: number;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [filter, categoryFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = { per_page: 100 };
      if (filter === 'unread') params.is_read = false;
      if (filter === 'read') params.is_read = true;
      
      const response = await axiosInstance.get('/api/notifications', { params });
      setNotifications(response.data.notifications || []);
      setTotal(response.data.total || 0);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categories = [...new Set(notifications.map(n => n.category))];

  const filteredNotifications = categoryFilter 
    ? notifications.filter(n => n.category === categoryFilter)
    : notifications;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BellIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CheckIcon className="h-4 w-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as 'all' | 'unread' | 'read')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === f 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BellIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak ada notifikasi</h3>
          <p className="text-gray-500 mt-1">
            {filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                !notification.is_read 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.notification_type)}`}>
                  {getNotificationIcon(notification.notification_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-base ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">{notification.category}</span>
                    <span>{formatDate(notification.created_at)}</span>
                    {notification.action_url && (
                      <span className="text-blue-600">Klik untuk detail →</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Menampilkan {filteredNotifications.length} dari {total} notifikasi
      </div>
    </div>
  );
};

export default NotificationsPage;
