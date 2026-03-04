import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  UserGroupIcon

} from '@heroicons/react/24/outline';
interface CapacityResource {
  id: number;
  resource_name: string;
  resource_type: 'machine' | 'labor' | 'facility';
  available_capacity: number;
  planned_capacity: number;
  utilization_percent: number;
  bottleneck: boolean;
  efficiency: number;
  status: 'active' | 'maintenance' | 'idle';
}

interface CapacityTimeline {
  date: string;
  available_capacity: number;
  planned_load: number;
  actual_load: number;
  utilization: number;
}

const CapacityPlanning: React.FC = () => {
  const { t } = useLanguage();

  const [resources, setResources] = useState<CapacityResource[]>([]);
  const [timeline, setTimeline] = useState<CapacityTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCapacityData();
  }, []);

  const loadCapacityData = async () => {
    try {
      setLoading(true);
      
      const [resourcesRes, timelineRes] = await Promise.all([
        axiosInstance.get('/api/mrp/capacity/resources'),
        axiosInstance.get('/api/mrp/capacity/timeline')
      ]);

      setResources(resourcesRes.data?.resources || []);
      setTimeline(timelineRes.data?.timeline || []);
    } catch (error) {
      console.error('Failed to load capacity data:', error);
      // Mock data
      setResources([
        { id: 1, resource_name: 'Production Line A', resource_type: 'machine', available_capacity: 100, planned_capacity: 85, utilization_percent: 85.0, bottleneck: false, efficiency: 92.5, status: 'active' },
        { id: 2, resource_name: 'Production Line B', resource_type: 'machine', available_capacity: 120, planned_capacity: 118, utilization_percent: 98.3, bottleneck: true, efficiency: 88.2, status: 'active' },
        { id: 3, resource_name: 'Quality Control', resource_type: 'labor', available_capacity: 80, planned_capacity: 72, utilization_percent: 90.0, bottleneck: false, efficiency: 95.8, status: 'active' },
        { id: 4, resource_name: 'Packaging Unit', resource_type: 'machine', available_capacity: 150, planned_capacity: 135, utilization_percent: 90.0, bottleneck: false, efficiency: 91.3, status: 'active' }
      ]);
      
      setTimeline([
        { date: 'Week 1', available_capacity: 1000, planned_load: 850, actual_load: 820, utilization: 82.0 },
        { date: 'Week 2', available_capacity: 1000, planned_load: 920, actual_load: 900, utilization: 90.0 },
        { date: 'Week 3', available_capacity: 950, planned_load: 880, actual_load: 860, utilization: 90.5 },
        { date: 'Week 4', available_capacity: 1100, planned_load: 980, actual_load: 0, utilization: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 95) return 'text-red-600 bg-red-100';
    if (utilization >= 85) return 'text-yellow-600 bg-yellow-100';
    if (utilization >= 70) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'idle': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading capacity planning data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/mrp"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to MRP Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Capacity Planning</h1>
            <p className="text-gray-600 mt-1">Manage production capacity and resource utilization</p>
          </div>
        </div>
      </div>

      {/* Capacity Timeline Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Utilization Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value, name) => [
              formatNumber(value as number),
              name === 'available_capacity' ? 'Available' :
              name === 'planned_load' ? 'Planned Load' : 'Actual Load'
            ]} />
            <Area type="monotone" dataKey="available_capacity" stackId="1" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.3} />
            <Area type="monotone" dataKey="planned_load" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="actual_load" stackId="3" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Resource Capacity Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Capacity Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bottleneck</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {resource.resource_type === 'machine' ? (
                        <CogIcon className="h-5 w-5 text-gray-400 mr-2" />
                      ) : resource.resource_type === 'labor' ? (
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <span className="font-medium text-gray-900">{resource.resource_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 capitalize">{resource.resource_type}</td>
                  <td className="px-4 py-3 text-gray-900">{formatNumber(resource.available_capacity)}</td>
                  <td className="px-4 py-3 text-gray-900">{formatNumber(resource.planned_capacity)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getUtilizationColor(resource.utilization_percent)}`}>
                        {formatPercent(resource.utilization_percent)}
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(resource.utilization_percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{formatPercent(resource.efficiency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resource.status)}`}>
                      {resource.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {resource.bottleneck ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CapacityPlanning;
