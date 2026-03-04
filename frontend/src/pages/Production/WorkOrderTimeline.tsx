import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  CubeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface ShiftProduction {
  id: number;
  production_date: string;
  shift: string;
  shift_start: string;
  shift_end: string;
  actual_quantity: number;
  good_quantity: number;
  reject_quantity: number;
  rework_quantity: number;
  planned_runtime: number;
  actual_runtime: number;
  downtime_minutes: number;
  machine_speed: number;
  efficiency_rate: number;
  quality_rate: number;
  oee_score: number;
  issues: string;
  notes: string;
  operator_name: string;
  created_at: string;
  average_time?: number;
  runtime?: number;
  waktu_tercatat?: number;
  waktu_tidak_tercatat?: number;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product_name: string;
  quantity: number;
  quantity_produced: number;
  quantity_good: number;
  status: string;
  machine_name: string;
  start_date: string;
  end_date: string;
}

interface TimelineEvent {
  id: number;
  date: string;
  shift: string;
  type: 'production' | 'downtime' | 'start' | 'complete';
  title: string;
  description: string;
  data: any;
  color: string;
  icon: any;
}

export default function WorkOrderTimeline() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [shiftProductions, setShiftProductions] = useState<ShiftProduction[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch work order details
      const woRes = await axiosInstance.get(`/api/production/work-orders/${id}`);
      setWorkOrder(woRes.data.work_order);
      
      // Fetch shift productions for this work order
      const spRes = await axiosInstance.get(`/api/production-input/shift-productions`, {
        params: { work_order_id: id }
      });
      const productions = spRes.data.shift_productions || [];
      setShiftProductions(productions);
      
      // Build timeline
      buildTimeline(woRes.data.work_order, productions);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data timeline');
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (wo: WorkOrder, productions: ShiftProduction[]) => {
    const events: TimelineEvent[] = [];
    
    // Add WO start event
    if (wo.start_date) {
      events.push({
        id: 0,
        date: wo.start_date,
        shift: '-',
        type: 'start',
        title: 'Work Order Dimulai',
        description: `Target: ${wo.quantity?.toLocaleString()} pcs`,
        data: wo,
        color: 'bg-blue-500',
        icon: PlayIcon
      });
    }
    
    // Add production events
    productions.forEach((sp, idx) => {
      const runtime = sp.runtime || sp.actual_runtime || 0;
      const avgTime = sp.average_time || sp.planned_runtime || 510;
      const waktuTercatat = sp.waktu_tercatat || (runtime + (sp.downtime_minutes || 0));
      const waktuTidakTercatat = sp.waktu_tidak_tercatat || Math.max(0, avgTime - waktuTercatat);
      
      events.push({
        id: sp.id,
        date: sp.production_date,
        shift: sp.shift?.replace('shift_', 'Shift ') || '-',
        type: 'production',
        title: `Produksi Shift ${sp.shift?.replace('shift_', '')}`,
        description: `Grade A: ${sp.good_quantity?.toLocaleString() || 0} pcs | Efisiensi: ${sp.efficiency_rate?.toFixed(1) || 0}%`,
        data: {
          ...sp,
          runtime,
          average_time: avgTime,
          waktu_tercatat: waktuTercatat,
          waktu_tidak_tercatat: waktuTidakTercatat
        },
        color: sp.efficiency_rate >= 60 ? 'bg-green-500' : sp.efficiency_rate >= 40 ? 'bg-yellow-500' : 'bg-red-500',
        icon: CubeIcon
      });
      
      // Add downtime event if significant
      if (sp.downtime_minutes > 30) {
        events.push({
          id: sp.id * 1000,
          date: sp.production_date,
          shift: sp.shift?.replace('shift_', 'Shift ') || '-',
          type: 'downtime',
          title: `Downtime Tercatat`,
          description: `Total: ${sp.downtime_minutes} menit`,
          data: sp,
          color: 'bg-orange-500',
          icon: PauseIcon
        });
      }
    });
    
    // Add WO complete event if completed
    if (wo.status === 'completed' && wo.end_date) {
      events.push({
        id: 999999,
        date: wo.end_date,
        shift: '-',
        type: 'complete',
        title: 'Work Order Selesai',
        description: `Total: ${wo.quantity_good?.toLocaleString() || 0} pcs (${((wo.quantity_good / wo.quantity) * 100).toFixed(1)}%)`,
        data: wo,
        color: 'bg-green-600',
        icon: CheckCircleIcon
      });
    }
    
    // Sort by date and shift
    events.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.shift.localeCompare(b.shift);
    });
    
    setTimeline(events);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getShiftTime = (shift: string) => {
    const shiftNum = shift.replace('shift_', '').replace('Shift ', '');
    switch(shiftNum) {
      case '1': return '06:30 - 15:00';
      case '2': return '15:00 - 23:00';
      case '3': return '23:00 - 06:30';
      default: return '-';
    }
  };

  // Calculate totals
  const totals = shiftProductions.reduce((acc, sp) => {
    const runtime = sp.runtime || sp.actual_runtime || 0;
    const avgTime = sp.average_time || sp.planned_runtime || 510;
    
    return {
      gradeA: acc.gradeA + (sp.good_quantity || 0),
      gradeB: acc.gradeB + (sp.rework_quantity || 0),
      gradeC: acc.gradeC + (sp.reject_quantity || 0),
      totalRuntime: acc.totalRuntime + runtime,
      totalDowntime: acc.totalDowntime + (sp.downtime_minutes || 0),
      totalAvgTime: acc.totalAvgTime + avgTime,
      shifts: acc.shifts + 1
    };
  }, { gradeA: 0, gradeB: 0, gradeC: 0, totalRuntime: 0, totalDowntime: 0, totalAvgTime: 0, shifts: 0 });

  const overallEfficiency = totals.totalAvgTime > 0 
    ? (totals.totalRuntime / totals.totalAvgTime * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Work Order tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/app/production/work-orders/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-blue-600" />
              Timeline Produksi
            </h1>
            <p className="text-gray-600">{workOrder.wo_number} - {workOrder.product_name}</p>
          </div>
        </div>
        <Link
          to={`/app/production/work-orders/${id}/breakdown`}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <ChartBarIcon className="h-5 w-5" />
          Breakdown
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Shift</p>
          <p className="text-2xl font-bold text-gray-700">{totals.shifts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Grade A</p>
          <p className="text-2xl font-bold text-green-600">{totals.gradeA.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Runtime</p>
          <p className="text-2xl font-bold text-blue-600">{totals.totalRuntime} m</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Downtime</p>
          <p className="text-2xl font-bold text-orange-600">{totals.totalDowntime} m</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Avg Efficiency</p>
          <p className={`text-2xl font-bold ${overallEfficiency >= 60 ? 'text-green-600' : 'text-red-600'}`}>
            {overallEfficiency.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Produksi</h2>
        
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Belum ada data produksi</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {timeline.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={`${event.id}-${index}`} className="relative pl-14">
                    {/* Timeline dot */}
                    <div className={`absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full ${event.color} flex items-center justify-center`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className={`bg-gray-50 rounded-lg p-4 border-l-4 ${event.color.replace('bg-', 'border-')}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDate(event.date)}
                          </div>
                          {event.shift !== '-' && (
                            <div className="text-xs text-gray-400">
                              {event.shift} ({getShiftTime(event.shift)})
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Production details */}
                      {event.type === 'production' && event.data && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-4">
                          {/* Time Stats Grid */}
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <div className="bg-gray-100 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-500">Average Time</p>
                              <p className="text-lg font-bold text-gray-700">{event.data.average_time}m</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-blue-600">Runtime</p>
                              <p className="text-lg font-bold text-blue-600">{event.data.runtime}m</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-orange-600">Downtime</p>
                              <p className="text-lg font-bold text-orange-600">{event.data.downtime_minutes || 0}m</p>
                            </div>
                            <div className={`rounded-lg p-2 text-center ${event.data.waktu_tercatat > event.data.average_time ? 'bg-red-50' : 'bg-green-50'}`}>
                              <p className={`text-xs ${event.data.waktu_tercatat > event.data.average_time ? 'text-red-600' : 'text-green-600'}`}>Tercatat</p>
                              <p className={`text-lg font-bold ${event.data.waktu_tercatat > event.data.average_time ? 'text-red-600' : 'text-green-600'}`}>
                                {event.data.waktu_tercatat}m
                                {event.data.waktu_tercatat > event.data.average_time && <span className="text-xs ml-1">⚠</span>}
                              </p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-red-600">Tidak Tercatat</p>
                              <p className="text-lg font-bold text-red-600">{event.data.waktu_tidak_tercatat}m</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-purple-600">Quality</p>
                              <p className="text-lg font-bold text-purple-600">{event.data.quality_rate?.toFixed(1) || 0}%</p>
                            </div>
                          </div>
                          
                          {/* Downtime Issues - Parsed and Categorized */}
                          {event.data.issues && (
                            <div className="bg-orange-50 rounded-lg p-3">
                              <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                Detail Downtime
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {event.data.issues.split(';').map((issue: string, idx: number) => {
                                  const match = issue.trim().match(/(\d+)\s*menit\s*-\s*(.+?)\s*\[(\w+)\]/);
                                  if (!match) return null;
                                  const [, minutes, reason, category] = match;
                                  const categoryColors: Record<string, string> = {
                                    mesin: 'bg-red-100 text-red-700 border-red-200',
                                    operator: 'bg-orange-100 text-orange-700 border-orange-200',
                                    material: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                    design: 'bg-purple-100 text-purple-700 border-purple-200',
                                    idle: 'bg-gray-100 text-gray-700 border-gray-200',
                                    others: 'bg-gray-100 text-gray-700 border-gray-200'
                                  };
                                  const colorClass = categoryColors[category.toLowerCase()] || categoryColors.others;
                                  
                                  return (
                                    <div key={idx} className={`flex items-center justify-between p-2 rounded border ${colorClass}`}>
                                      <div className="flex-1">
                                        <span className="text-sm">{reason}</span>
                                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-white/50">{category}</span>
                                      </div>
                                      <span className="font-bold text-sm ml-2">{minutes}m</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Operator */}
                          {event.data.operator_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                              <UserIcon className="h-4 w-4" />
                              <span>Operator: <strong>{event.data.operator_name}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Production Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detail Per Shift</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Grade A</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Runtime</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Downtime</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tercatat</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tidak Tercatat</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Efisiensi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shiftProductions.map((sp) => {
                const runtime = sp.runtime || sp.actual_runtime || 0;
                const avgTime = sp.average_time || sp.planned_runtime || 510;
                const waktuTercatat = sp.waktu_tercatat || (runtime + (sp.downtime_minutes || 0));
                const waktuTidakTercatat = sp.waktu_tidak_tercatat || Math.max(0, avgTime - waktuTercatat);
                const efficiency = avgTime > 0 ? (runtime / avgTime * 100) : 0;
                
                return (
                  <tr key={sp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(sp.production_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {sp.shift?.replace('shift_', '')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      {sp.good_quantity?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {avgTime}m
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                      {runtime}m
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                      {sp.downtime_minutes || 0}m
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${waktuTercatat > avgTime ? 'text-red-600' : 'text-green-600'}`}>
                      {waktuTercatat}m
                      {waktuTercatat > avgTime && (
                        <span className="text-xs ml-1">⚠</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {waktuTidakTercatat}m
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${efficiency >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                      {efficiency.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
              {shiftProductions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data produksi
                  </td>
                </tr>
              )}
            </tbody>
            {shiftProductions.length > 0 && (
              <tfoot className="bg-gray-100">
                <tr className="font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{totals.gradeA.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">{totals.totalAvgTime}m</td>
                  <td className="px-4 py-3 text-sm text-right text-blue-600">{totals.totalRuntime}m</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600">{totals.totalDowntime}m</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">{totals.totalRuntime + totals.totalDowntime}m</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{Math.max(0, totals.totalAvgTime - totals.totalRuntime - totals.totalDowntime)}m</td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${overallEfficiency >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {overallEfficiency.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
