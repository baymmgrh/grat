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

interface DowntimeItem {
  reason: string;
  duration_minutes: number;
}

interface ShiftData {
  shift: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  total: number;
  runtime_minutes?: number;
  downtime_minutes?: number;
  idle_time_minutes?: number;
}

interface OEEData {
  date: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  product_name?: string;
  target_quantity?: number;
  actual_quantity?: number;
  top_3_downtime?: DowntimeItem[];
  shifts?: ShiftData[];
  pack_per_karton?: number;
  // New fields for runtime/downtime tracking
  runtime_minutes?: number;
  total_downtime_minutes?: number;
  idle_time_minutes?: number;
  planned_runtime_minutes?: number;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'controller'>('overview');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

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
          // Group records by date to combine shifts
          const recordsByDate: { [key: string]: any[] } = {};
          oeeRes.data.records.forEach((r: any) => {
            const date = r.record_date || r.created_at?.split('T')[0];
            if (!recordsByDate[date]) {
              recordsByDate[date] = [];
            }
            recordsByDate[date].push(r);
          });
          
          // Convert grouped records to OEEData with shifts array
          const groupedHistory = Object.entries(recordsByDate).map(([date, records]) => {
            // Aggregate data from all shifts for this date
            const shifts = records.map((r: any) => r.shift_data).filter(Boolean);
            const totalTarget = records.reduce((sum: number, r: any) => sum + (r.target_quantity || 0), 0);
            const totalActual = records.reduce((sum: number, r: any) => sum + (r.actual_quantity || 0), 0);
            const avgOee = records.reduce((sum: number, r: any) => sum + (r.oee_percentage || 0), 0) / records.length;
            const avgAvailability = records.reduce((sum: number, r: any) => sum + (r.availability || 0), 0) / records.length;
            const avgPerformance = records.reduce((sum: number, r: any) => sum + (r.performance || 0), 0) / records.length;
            const avgQuality = records.reduce((sum: number, r: any) => sum + (r.quality || 0), 0) / records.length;
            
            // Combine all downtimes and get top 3
            const allDowntimes = records.flatMap((r: any) => r.top_3_downtime || []);
            allDowntimes.sort((a: any, b: any) => b.duration_minutes - a.duration_minutes);
            const top3 = allDowntimes.slice(0, 3);
            
            return {
              date,
              oee: avgOee,
              availability: avgAvailability,
              performance: avgPerformance,
              quality: avgQuality,
              product_name: records[0]?.product_name || null,
              target_quantity: totalTarget,
              actual_quantity: totalActual,
              top_3_downtime: top3,
              shifts: shifts.sort((a: any, b: any) => a.shift - b.shift),
              pack_per_karton: records[0]?.pack_per_karton || 50
            };
          });
          
          // Sort by date descending
          groupedHistory.sort((a, b) => b.date.localeCompare(a.date));
          setOeeHistory(groupedHistory);
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
            { id: 'controller', label: 'Controller', icon: ChartBarIcon }
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

      {/* Controller Tab - Daily Efficiency Report */}
      {activeTab === 'controller' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">📊 Daily Efficiency Report</h3>
                <p className="text-sm text-gray-500">Click on a row to expand details</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  id="export-period"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  defaultValue="day"
                  onChange={(e) => {
                    const dateInput = document.getElementById('export-date') as HTMLInputElement;
                    if (dateInput) {
                      dateInput.style.display = e.target.value === 'day' ? 'block' : 'none';
                    }
                  }}
                >
                  <option value="day">Perhari</option>
                  <option value="week">Seminggu</option>
                  <option value="month">Sebulan</option>
                </select>
                <input
                  type="date"
                  id="export-date"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                <button
                  onClick={async () => {
                    try {
                      const period = (document.getElementById('export-period') as HTMLSelectElement)?.value || 'day';
                      const selectedDate = (document.getElementById('export-date') as HTMLInputElement)?.value;
                      
                      let url_params = `machine_id=${id}&period=${period}`;
                      if (period === 'day' && selectedDate) {
                        url_params += `&date=${selectedDate}`;
                      }
                      
                      const response = await axiosInstance.get(`/api/oee/export-excel?${url_params}`, {
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      const periodLabel = period === 'month' ? 'sebulan' : period === 'week' ? 'seminggu' : selectedDate;
                      link.setAttribute('download', `controller_report_${machine?.name || 'machine'}_${periodLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Export failed:', error);
                      alert('Export failed. Please try again.');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
              </div>
            </div>
            
            {oeeHistory.length > 0 ? (
              <div className="space-y-2">
                {oeeHistory.map((day, index) => {
                  const efficiency = day.oee || 0;
                  const isExpanded = expandedDays.has(day.date);
                  const isGood = efficiency >= 60;
                  
                  // Use top_3_downtime from API response
                  const dayDowntimes = day.top_3_downtime || [];
                  
                  return (
                    <div key={day.date} className="border rounded-lg overflow-hidden">
                      {/* Header Row - Clickable */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedDays);
                          if (isExpanded) {
                            newExpanded.delete(day.date);
                          } else {
                            newExpanded.add(day.date);
                          }
                          setExpandedDays(newExpanded);
                        }}
                        className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                          isGood ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="text-left">
                              <p className="font-medium text-gray-900">{day.product_name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{day.date}</p>
                            </div>
                          </div>
                          {/* Target vs Actual in header - converted to karton */}
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Target</p>
                              <p className="text-xl font-bold text-blue-600">{Math.round((day.target_quantity || 0) / (day.pack_per_karton || 50)).toLocaleString()}</p>
                              <p className="text-xs text-gray-400">karton</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Aktual</p>
                              <p className="text-xl font-bold text-green-600">{Math.round((day.actual_quantity || 0) / (day.pack_per_karton || 50)).toLocaleString()}</p>
                              <p className="text-xs text-gray-400">karton</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                              {efficiency.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">Efficiency</p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="p-4 bg-white border-t">
                          {/* Production per Shift - with Runtime, Downtime, Idle Time */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">📦 Detail per Shift</p>
                            {day.shifts && day.shifts.length > 0 ? (
                              <div className="space-y-3">
                                {day.shifts.map((shift) => (
                                  <div key={shift.shift} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-semibold text-gray-800 text-base">
                                        Shift {shift.shift} 
                                        <span className="text-xs font-normal text-gray-500 ml-2">
                                          ({shift.shift === 1 ? '06:30-15:00' : shift.shift === 2 ? '15:00-23:00' : '23:00-06:30'})
                                        </span>
                                      </span>
                                      <span className="text-sm font-medium text-blue-600">Total: {shift.total.toLocaleString()} pcs</span>
                                    </div>
                                    
                                    {/* Production Grades */}
                                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                                      <div className="p-2 bg-green-100 rounded text-center">
                                        <p className="text-xs text-gray-500">Grade A</p>
                                        <p className="font-bold text-green-600">{shift.grade_a.toLocaleString()}</p>
                                      </div>
                                      <div className="p-2 bg-yellow-100 rounded text-center">
                                        <p className="text-xs text-gray-500">Grade B</p>
                                        <p className="font-bold text-yellow-600">{shift.grade_b.toLocaleString()}</p>
                                      </div>
                                      <div className="p-2 bg-red-100 rounded text-center">
                                        <p className="text-xs text-gray-500">Grade C</p>
                                        <p className="font-bold text-red-600">{shift.grade_c.toLocaleString()}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Runtime, Downtime, Idle per Shift */}
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div className="p-2 bg-green-50 rounded text-center border border-green-200">
                                        <p className="text-xs text-gray-500">Runtime</p>
                                        <p className="font-bold text-green-600">{shift.runtime_minutes || 480} menit</p>
                                      </div>
                                      <div className="p-2 bg-red-50 rounded text-center border border-red-200">
                                        <p className="text-xs text-gray-500">Downtime</p>
                                        <p className="font-bold text-red-600">{shift.downtime_minutes || 0} menit</p>
                                      </div>
                                      <div className="p-2 bg-orange-50 rounded text-center border border-orange-200">
                                        <p className="text-xs text-gray-500">Idle Time</p>
                                        <p className="font-bold text-orange-600">{shift.idle_time_minutes || 0} menit</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No shift data available</p>
                            )}
                          </div>

                          {/* Daily Total Summary */}
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800 mb-2">📊 Total Hari Ini</p>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="p-2 bg-white rounded text-center">
                                <p className="text-xs text-gray-500">Runtime</p>
                                <p className="text-lg font-bold text-green-600">
                                  {day.runtime_minutes !== undefined ? day.runtime_minutes : 
                                    Math.round((day.planned_runtime_minutes || 480))} menit
                                </p>
                              </div>
                              <div className="p-2 bg-white rounded text-center">
                                <p className="text-xs text-gray-500">Total Downtime</p>
                                <p className="text-lg font-bold text-red-600">
                                  {day.total_downtime_minutes !== undefined ? day.total_downtime_minutes : 0} menit
                                </p>
                              </div>
                              <div className="p-2 bg-white rounded text-center">
                                <p className="text-xs text-gray-500">Idle Time</p>
                                <p className="text-lg font-bold text-orange-600">
                                  {day.idle_time_minutes || 0} menit
                                </p>
                              </div>
                              <div className="p-2 bg-white rounded text-center">
                                <p className="text-xs text-gray-500">Quality</p>
                                <p className="text-lg font-bold text-purple-600">{day.quality?.toFixed(1) || 0}%</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Top 3 Downtime */}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🔴 Top 3 Downtime</p>
                            {dayDowntimes.length > 0 ? (
                              <div className="space-y-2">
                                {dayDowntimes.map((dt, idx) => {
                                  const runtimeVal = day.runtime_minutes || (day.planned_runtime_minutes || 480) - (day.total_downtime_minutes || 0);
                                  const percentage = runtimeVal > 0 ? ((dt.duration_minutes / runtimeVal) * 100).toFixed(1) : 0;
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 text-xs font-bold rounded">
                                          {idx + 1}
                                        </span>
                                        <span className="text-sm text-gray-700">{dt.reason}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-red-600">{dt.duration_minutes} menit</span>
                                        <span className="text-xs text-red-500">({percentage}%)</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No downtime recorded</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No efficiency data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineDetail;
