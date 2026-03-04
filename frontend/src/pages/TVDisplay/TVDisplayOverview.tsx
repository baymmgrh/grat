import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  TruckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
interface OverviewData {
  type: string;
  timestamp: string;
  production: {
    active_work_orders: number;
    active_machines: number;
    today_production: number;
    efficiency_avg: number;
  };
  shipping: {
    active_shipments: number;
    preparing_count: number;
    shipped_count: number;
  };
  roster: {
    total_assignments: number;
    machines_with_operators: number;
    unassigned_machines: number;
  };
  top_active_shipments: Array<{
    shipping_number: string;
    customer_name: string;
    status: string;
    shipping_date: string;
  }>;
}

export default function TVDisplayOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/tv-display/fullscreen?type=overview');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const overviewData = await response.json();
      
      setData(overviewData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      // Set empty data on error - no mock data
      setData({
        type: 'overview',
        timestamp: new Date().toISOString(),
        production: {
          active_work_orders: 0,
          active_machines: 0,
          today_production: 0,
          efficiency_avg: 0
        },
        shipping: {
          active_shipments: 0,
          preparing_count: 0,
          shipped_count: 0
        },
        roster: {
          total_assignments: 0,
          machines_with_operators: 0,
          unassigned_machines: 0
        },
        top_active_shipments: []
      });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-16 w-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Factory Overview Dashboard</h1>
          <p className="text-gray-300 text-lg">Real-time operational monitoring</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono">{formatTime(lastUpdate)}</div>
          <div className="text-gray-400">Last Updated</div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Production Card */}
        <div className="bg-blue-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CogIcon className="h-12 w-12 text-blue-300" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data?.production.active_work_orders}</div>
              <div className="text-blue-300">Active Work Orders</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-blue-200">Active Machines:</span>
              <span className="font-semibold">{data?.production.active_machines}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Today's Production:</span>
              <span className="font-semibold">{data?.production.today_production?.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Avg Efficiency:</span>
              <span className="font-semibold">{data?.production.efficiency_avg?.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Shipping Card */}
        <div className="bg-green-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TruckIcon className="h-12 w-12 text-green-300" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data?.shipping.active_shipments}</div>
              <div className="text-green-300">Active Shipments</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-200">Preparing:</span>
              <span className="font-semibold">{data?.shipping.preparing_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Shipped:</span>
              <span className="font-semibold">{data?.shipping.shipped_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Completion Rate:</span>
              <span className="font-semibold">
                {data?.shipping.active_shipments ? 
                  ((data.shipping.shipped_count / data.shipping.active_shipments) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Roster Card */}
        <div className="bg-purple-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <UsersIcon className="h-12 w-12 text-purple-300" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data?.roster.total_assignments}</div>
              <div className="text-purple-300">Employee Assignments</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-purple-200">Machines with Operators:</span>
              <span className="font-semibold">{data?.roster.machines_with_operators}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200">Unassigned Machines:</span>
              <span className={`font-semibold ${data?.roster.unassigned_machines === 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data?.roster.unassigned_machines}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200">Coverage:</span>
              <span className="font-semibold">
                {data?.roster.machines_with_operators && data?.roster.total_assignments ? 
                  ((data.roster.machines_with_operators / (data.roster.machines_with_operators + data.roster.unassigned_machines)) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Shipments */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <TruckIcon className="h-6 w-6 mr-2" />
            Top Active Shipments
          </h3>
          <div className="space-y-4">
            {data?.top_active_shipments.map((shipment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-semibold">{shipment.shipping_number}</div>
                  <div className="text-gray-300 text-sm">{shipment.customer_name}</div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                    {shipment.status.toUpperCase()}
                  </span>
                  <div className="text-gray-400 text-sm mt-1">
                    {new Date(shipment.shipping_date).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
                <span>Production System</span>
              </div>
              <span className="text-green-400 font-semibold">ONLINE</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
                <span>Shipping System</span>
              </div>
              <span className="text-green-400 font-semibold">ONLINE</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
                <span>HR System</span>
              </div>
              <span className="text-green-400 font-semibold">ONLINE</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-yellow-400 mr-3" />
                <span>Data Sync</span>
              </div>
              <span className="text-yellow-400 font-semibold">SYNCING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4 bg-gray-800 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center text-sm text-gray-300">
          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
          Auto-refresh: 30s
        </div>
      </div>
    </div>
  );
}
