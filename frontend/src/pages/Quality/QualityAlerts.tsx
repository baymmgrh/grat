import React, { useState } from 'react';
import { useGetQualityAlertsQuery, useAcknowledgeQualityAlertMutation, useResolveQualityAlertMutation } from '../../services/api';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon

} from '@heroicons/react/24/outline';
interface QualityAlert {
  id: number;
  alert_number: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  product_name?: string;
  machine_name?: string;
  threshold_value?: number;
  actual_value?: number;
  status: string;
  created_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export default function QualityAlerts() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolveNotes, setResolveNotes] = useState<{[key: number]: string}>({});

  const { data: alertsData, isLoading, refetch } = useGetQualityAlertsQuery({ 
    status: statusFilter,
    severity: severityFilter 
  });
  const [acknowledgeAlert] = useAcknowledgeQualityAlertMutation();
  const [resolveAlert] = useResolveQualityAlertMutation();

  const alerts = alertsData?.alerts || [];

  const handleAcknowledge = async (alertId: number) => {
    try {
      await acknowledgeAlert(alertId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await resolveAlert({ 
        alertId, 
        resolution_notes: resolveNotes[alertId] || '' 
      }).unwrap();
      setResolveNotes(prev => ({ ...prev, [alertId]: '' }));
      refetch();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <BellIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alert.product_name && alert.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Alerts</h1>
          <p className="text-gray-600">Monitor and manage quality issues and alerts</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status FunnelIcon */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="">All Status</option>
            </select>
          </div>

          {/* Severity FunnelIcon */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-500">No quality alerts match your current filters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getSeverityIcon(alert.severity)}
                    <span className={`px-3 py-1 text-sm rounded-full border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">#{alert.alert_number}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{alert.title}</h3>
                  <p className="text-gray-600 mb-4">{alert.message}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {alert.product_name && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Product:</span>
                        <p className="text-sm text-gray-900">{alert.product_name}</p>
                      </div>
                    )}
                    {alert.machine_name && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Machine:</span>
                        <p className="text-sm text-gray-900">{alert.machine_name}</p>
                      </div>
                    )}
                    {alert.threshold_value && alert.actual_value && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Values:</span>
                        <p className="text-sm text-gray-900">
                          Actual: {alert.actual_value} | Threshold: {alert.threshold_value}
                        </p>
                      </div>
                    )}
                  </div>

                  {alert.acknowledged_at && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        Acknowledged by {alert.acknowledged_by} on {new Date(alert.acknowledged_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  {alert.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="btn-secondary btn-sm flex items-center gap-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <div className="space-y-2">
                        <textarea
                          placeholder="Resolution notes..."
                          value={resolveNotes[alert.id] || ''}
                          onChange={(e) => setResolveNotes(prev => ({ ...prev, [alert.id]: e.target.value }))}
                          className="w-48 p-2 text-sm border border-gray-300 rounded-lg resize-none"
                          rows={2}
                        />
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="btn-primary btn-sm w-full flex items-center justify-center gap-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                  {alert.status === 'acknowledged' && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Resolution notes..."
                        value={resolveNotes[alert.id] || ''}
                        onChange={(e) => setResolveNotes(prev => ({ ...prev, [alert.id]: e.target.value }))}
                        className="w-48 p-2 text-sm border border-gray-300 rounded-lg resize-none"
                        rows={2}
                      />
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="btn-primary btn-sm w-full flex items-center justify-center gap-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {alert.status === 'resolved' && (
                    <span className="text-sm text-green-600 font-medium">✓ Resolved</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
