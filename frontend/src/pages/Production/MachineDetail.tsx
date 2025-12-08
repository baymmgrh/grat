import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
// import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Machine {
  id: number;
  code: string;
  name: string;
  machine_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: string;
  location?: string;
  department?: string;
  capacity_per_hour?: number;
  capacity_uom?: string;
  efficiency: number;
  availability: number;
  installation_date?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
  is_active: boolean;
}

interface OEEData {
  date: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

interface MaintenanceRecord {
  id: number;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: string;
}

interface DowntimeRecord {
  id: number;
  reason: string;
  duration_minutes: number;
  start_time: string;
  end_time?: string;
}

const MachineDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [machine, setMachine] = useState<Machine | null>(null);
  const [oeeHistory, setOeeHistory] = useState<OEEData[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'oee' | 'maintenance' | 'downtime'>('overview');

  useEffect(() => {
    if (id) {
      fetchMachineData();
    }
  }, [id]);

  const fetchMachineData = async () => {
    try {
      setLoading(true);
      
      // Fetch machine details
      const machineRes = await axiosInstance.get(`/api/production/machines/${id}`);
      // API returns { machine: {...} }
      const machineData = machineRes.data.machine || machineRes.data;
      machineData.status = machineData.status || 'idle';
      setMachine(machineData);
      
      // Fetch OEE history from database
      try {
        const oeeRes = await axiosInstance.get(`/api/oee/records?machine_id=${id}&limit=30`);
        if (oeeRes.data.records) {
          setOeeHistory(oeeRes.data.records.map((r: any) => ({
            date: r.record_date || r.created_at?.split('T')[0],
            oee: r.oee_percentage || 0,
            availability: r.availability || 0,
            performance: r.performance || 0,
            quality: r.quality || 0
          })));
        }
      } catch {
        setOeeHistory([]);
      }
      
      // Fetch maintenance records from database
      try {
        const maintRes = await axiosInstance.get(`/api/maintenance?machine_id=${id}&limit=10`);
        if (maintRes.data.records) {
          setMaintenanceRecords(maintRes.data.records);
        }
      } catch {
        setMaintenanceRecords([]);
      }
      
      // Fetch downtime records from database
      try {
        const downtimeRes = await axiosInstance.get(`/api/oee/downtime?machine_id=${id}&limit=10`);
        if (downtimeRes.data.records) {
          setDowntimeRecords(downtimeRes.data.records);
        }
      } catch {
        setDowntimeRecords([]);
      }
      
    } catch (error) {
      console.error('Error fetching machine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'breakdown': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayIcon className="w-5 h-5 text-green-600" />;
      case 'idle': return <PauseIcon className="w-5 h-5 text-yellow-600" />;
      case 'maintenance': return <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />;
      case 'breakdown': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default: return <CogIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Machine not found</p>
        <button onClick={() => navigate('/app/production/machines')} className="mt-4 text-blue-600 hover:underline">
          Back to Machine List
        </button>
      </div>
    );
  }

  const avgOEE = oeeHistory.length > 0 
    ? (oeeHistory.reduce((sum, d) => sum + d.oee, 0) / oeeHistory.length).toFixed(1)
    : (machine.efficiency || 100);

  const totalDowntime = downtimeRecords.reduce((sum, d) => sum + d.duration_minutes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/production/machines')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
            <p className="text-gray-500">{machine.code} • {machine.machine_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(machine.status || 'idle')}`}>
            {getStatusIcon(machine.status || 'idle')}
            {(machine.status || 'idle').charAt(0).toUpperCase() + (machine.status || 'idle').slice(1)}
          </span>
          <Link
            to={`/app/production/machines/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: 'overview', label: 'Overview', icon: CubeIcon },
            { id: 'oee', label: 'OEE Analytics', icon: ChartBarIcon },
            { id: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon },
            { id: 'downtime', label: 'Downtime', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Machine Info */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Machine Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CogIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{machine.machine_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Manufacturer</p>
                  <p className="font-medium">{machine.manufacturer || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CubeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{machine.model || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{machine.location || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{machine.capacity_per_hour || 0} {machine.capacity_uom || 'units/hour'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Next Maintenance</p>
                  <p className="font-medium">{machine.next_maintenance || 'Not scheduled'}</p>
                </div>
              </div>
            </div>
            {machine.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{machine.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average OEE (30 days)</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-600">{avgOEE}%</span>
              </div>
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={oeeHistory.slice(-7)}>
                    <Area type="monotone" dataKey="oee" stroke="#3B82F6" fill="#93C5FD" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Availability</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-600">{machine.availability || 100}%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Downtime (30 days)</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-red-600">{Math.round(totalDowntime / 60)}h</span>
                <span className="text-gray-500 mb-1">{totalDowntime % 60}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OEE Analytics Tab */}
      {activeTab === 'oee' && (
        <div className="space-y-6">
          {/* OEE Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">OEE Trend (Last 30 Days)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={oeeHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="oee" name="OEE" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="availability" name="Availability" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="performance" name="Performance" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="quality" name="Quality" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OEE Components */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'OEE', value: avgOEE, color: 'blue' },
              { label: 'Availability', value: oeeHistory.length > 0 ? (oeeHistory.reduce((s, d) => s + d.availability, 0) / oeeHistory.length).toFixed(1) : 85, color: 'green' },
              { label: 'Performance', value: oeeHistory.length > 0 ? (oeeHistory.reduce((s, d) => s + d.performance, 0) / oeeHistory.length).toFixed(1) : 80, color: 'yellow' },
              { label: 'Quality', value: oeeHistory.length > 0 ? (oeeHistory.reduce((s, d) => s + d.quality, 0) / oeeHistory.length).toFixed(1) : 95, color: 'purple' }
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <p className="text-sm text-gray-500 mb-2">{item.label}</p>
                <p className={`text-3xl font-bold text-${item.color}-600`}>{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Maintenance History</h3>
            <Link
              to={`/app/maintenance/new?machine_id=${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Schedule Maintenance
            </Link>
          </div>
          {maintenanceRecords.length > 0 ? (
            <div className="divide-y">
              {maintenanceRecords.map((record) => (
                <div key={record.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{record.maintenance_type}</p>
                    <p className="text-sm text-gray-500">{record.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{record.scheduled_date}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      record.status === 'completed' ? 'bg-green-100 text-green-800' :
                      record.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No maintenance records found</p>
            </div>
          )}
        </div>
      )}

      {/* Downtime Tab */}
      {activeTab === 'downtime' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Downtime Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Downtime</p>
                <p className="text-2xl font-bold text-red-600">{Math.round(totalDowntime / 60)}h {totalDowntime % 60}m</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">Incidents</p>
                <p className="text-2xl font-bold text-yellow-600">{downtimeRecords.length}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg Duration</p>
                <p className="text-2xl font-bold text-blue-600">
                  {downtimeRecords.length > 0 ? Math.round(totalDowntime / downtimeRecords.length) : 0}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Downtime Events</h3>
            </div>
            {downtimeRecords.length > 0 ? (
              <div className="divide-y">
                {downtimeRecords.map((record) => (
                  <div key={record.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{record.reason}</p>
                      <p className="text-sm text-gray-500">{record.start_time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{record.duration_minutes} minutes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No downtime records found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineDetail;
