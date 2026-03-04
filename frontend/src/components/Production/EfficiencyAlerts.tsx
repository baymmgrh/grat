import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';

interface Alert {
  machine_id: number;
  machine_name: string;
  efficiency: number;
  target: number;
  gap: number;
  level: 'critical' | 'warning';
}

interface AlertsData {
  date: string;
  alerts: Alert[];
  total_alerts: number;
  critical_count: number;
  warning_count: number;
}

const EfficiencyAlerts: React.FC = () => {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axiosInstance.get('/api/oee/efficiency-alerts');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching efficiency alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!data || data.total_alerts === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <ChartBarIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Semua Mesin On Target</h3>
            <p className="text-sm text-green-600">Tidak ada alert efisiensi hari ini</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm overflow-hidden ${data.critical_count > 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
      {/* Header */}
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer ${data.critical_count > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${data.critical_count > 0 ? 'bg-red-200' : 'bg-yellow-200'}`}>
            {data.critical_count > 0 ? (
              <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${data.critical_count > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
              Alert Efisiensi Hari Ini
            </h3>
            <p className={`text-sm ${data.critical_count > 0 ? 'text-red-600' : 'text-yellow-600'}`}>
              {data.critical_count > 0 && <span className="font-medium">{data.critical_count} Critical</span>}
              {data.critical_count > 0 && data.warning_count > 0 && ' • '}
              {data.warning_count > 0 && <span>{data.warning_count} Warning</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${data.critical_count > 0 ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>
            {data.total_alerts} Mesin
          </span>
          <svg 
            className={`h-5 w-5 transition-transform ${collapsed ? '' : 'rotate-180'} ${data.critical_count > 0 ? 'text-red-600' : 'text-yellow-600'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Alerts List */}
      {!collapsed && (
        <div className="p-4 space-y-2">
          {data.alerts.slice(0, 5).map((alert) => (
            <div 
              key={alert.machine_id}
              className={`flex items-center justify-between p-3 rounded-lg ${alert.level === 'critical' ? 'bg-red-100' : 'bg-yellow-100'}`}
            >
              <div className="flex items-center gap-3">
                {alert.level === 'critical' ? (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className={`font-medium ${alert.level === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                    {alert.machine_name}
                  </p>
                  <p className={`text-xs ${alert.level === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                    Gap: -{alert.gap}% dari target
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${alert.level === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {alert.efficiency}%
                </p>
                <p className="text-xs text-slate-500">Target: {alert.target}%</p>
              </div>
            </div>
          ))}
          
          {data.alerts.length > 5 && (
            <p className="text-center text-sm text-slate-500 py-2">
              + {data.alerts.length - 5} mesin lainnya
            </p>
          )}

          <Link 
            to="/app/production/controller"
            className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium ${data.critical_count > 0 ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'}`}
          >
            Lihat Detail Controller
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default EfficiencyAlerts;
