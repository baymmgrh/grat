import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ChartBarIcon,
  UserIcon,
  DocumentTextIcon,
  TableCellsIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface DowntimeDetail {
  reason: string;
  duration_minutes: number;
  category: string;
  is_idle: boolean;
  shift: number;
  pic: string;
  root_cause?: string | null;
  action_taken?: string | null;
  status?: string;
  product_name: string | null;
  wo_number: string | null;
}

interface WorkOrderDetail {
  wo_id: number;
  wo_number: string;
  machine_id: number;
  machine_name: string;
  product_name: string;
  product_code: string | null;
  target_quantity: number;
  actual_quantity: number;
  good_quantity: number;
  reject_quantity: number;
  rework_quantity: number;
  efficiency: number;
  quality_rate: number;
  shifts_worked: number[];
  operators: string[];
  supervisors: string[];
  status: string;
  start_date: string | null;
  due_date: string | null;
}

interface TimelineEntry {
  machine_id: number;
  machine_name: string;
  shift: number;
  start_time: string;
  end_time: string;
  product_name: string;
  wo_number: string | null;
  output: number;
  grade_a: number;
  downtime: number;
  idle: number;
  operator: string | null;
  supervisor: string | null;
  efficiency_rate: number;
  quality_rate: number;
}

interface MachineDetailData {
  machine_id: number;
  machine_name: string;
  machine_code: string | null;
  target_efficiency: number;
  date: string;
  all_downtime: DowntimeDetail[];
  work_orders: WorkOrderDetail[];
  timeline: TimelineEntry[];
  operators: string[];
  supervisors: string[];
  total_output: number;
  total_grade_a: number;
  total_grade_b: number;
  total_grade_c: number;
  total_downtime: number;
  total_idle: number;
  total_runtime: number;
}

interface SummaryShiftData {
  shift: number;
  wo_number?: string;
  product_name?: string;
  grade_a?: number;
  total?: number;
}

interface SummaryShiftSummary {
  shift: number;
  efficiency: number;
  machine_efficiency: number;
  grade_a: number;
  total_output: number;
}

interface SummaryMachineData {
  machine_id: number;
  machine_name: string;
  efficiency: number;
  machine_efficiency: number;
  quality: number;
  total_output: number;
  total_grade_a: number;
  total_downtime: number;
  total_idle: number;
  shifts: SummaryShiftData[];
  shift_summaries?: SummaryShiftSummary[];
}

interface DailyControllerDetailProps {
  selectedDate: string;
  summaryData?: SummaryMachineData[];
}

const DailyControllerDetail: React.FC<DailyControllerDetailProps> = ({ selectedDate, summaryData }) => {
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<MachineDetailData[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderDetail[]>([]);
  const [summary, setSummary] = useState<{
    total_downtime: number;
    total_idle: number;
    total_output: number;
    total_grade_a: number;
    total_work_orders: number;
    avg_efficiency: number;
  } | null>(null);
  const [expandedMachine, setExpandedMachine] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'downtime' | 'timeline' | 'workorders'>('downtime');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchDetailData();
  }, [selectedDate]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/oee/daily-controller-detail?date=${selectedDate}`);
      setMachines(response.data.machines || []);
      setWorkOrders(response.data.work_orders || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error('Error fetching detail data:', error);
      setMachines([]);
      setWorkOrders([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mesin': return 'bg-red-100 text-red-700 border-red-200';
      case 'operator': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'material': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'idle': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'istirahat': return 'bg-green-100 text-green-700 border-green-200';
      case 'others': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mesin': return 'Mesin';
      case 'operator': return 'Operator';
      case 'material': return 'Material';
      case 'idle': return 'Idle';
      case 'design': return 'Design';
      case 'istirahat': return 'Istirahat';
      case 'others': return 'Lainnya';
      default: return 'Lainnya';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleExpand = (machineId: number) => {
    setExpandedMachine(expandedMachine === machineId ? null : machineId);
  };

  // Get unique categories for filter
  const allCategories: string[] = Array.from(
    new Set(machines.flatMap(m => m.all_downtime.map(d => d.category)))
  );

  // Use summaryData from parent (tab Ringkasan) or calculate from local data
  const totalDowntime = summaryData
    ? summaryData.reduce((sum, m) => sum + m.total_downtime, 0)
    : (summary?.total_downtime ?? machines.reduce((sum, m) => sum + m.total_downtime, 0));

  const totalIdle = summaryData
    ? summaryData.reduce((sum, m) => sum + m.total_idle, 0)
    : (summary?.total_idle ?? machines.reduce((sum, m) => sum + m.total_idle, 0));

  // Count unique WO numbers from summaryData
  const totalWOs = summaryData
    ? new Set(summaryData.flatMap(m => m.shifts.map(s => s.wo_number).filter(Boolean))).size
    : (summary?.total_work_orders ?? workOrders.length);

  // Calculate average efficiency from summaryData (machine_efficiency)
  const avgEfficiency = summaryData && summaryData.length > 0
    ? Math.round(summaryData.reduce((sum, m) => sum + (m.machine_efficiency || 0), 0) / summaryData.length * 10) / 10
    : (summary?.avg_efficiency ?? 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <DocumentTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600">Tidak ada data detail</h3>
        <p className="text-slate-400 mt-1">Belum ada data produksi untuk tanggal ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-80">Total Downtime</span>
          </div>
          <p className="text-3xl font-bold">{totalDowntime} <span className="text-lg">menit</span></p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-80">Total Idle</span>
          </div>
          <p className="text-3xl font-bold">{totalIdle} <span className="text-lg">menit</span></p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-80">Work Orders</span>
          </div>
          <p className="text-3xl font-bold">{totalWOs}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-80">Avg Efficiency</span>
          </div>
          <p className="text-3xl font-bold">{avgEfficiency}%</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setActiveSubTab('downtime')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSubTab === 'downtime'
              ? 'bg-red-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-2" />
            Semua Downtime
          </button>
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSubTab === 'timeline'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <ClockIcon className="h-4 w-4 inline mr-2" />
            Timeline Produksi
          </button>
          <button
            onClick={() => setActiveSubTab('workorders')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSubTab === 'workorders'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-2" />
            Detail Work Orders
          </button>
        </div>

        {/* Downtime Tab */}
        {activeSubTab === 'downtime' && (
          <div>
            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
              <FunnelIcon className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-600">Filter Kategori:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">Semua Kategori</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>

            {/* Machines with Downtime */}
            <div className="space-y-4">
              {machines.map((machine) => {
                const filteredDowntime = categoryFilter === 'all'
                  ? machine.all_downtime
                  : machine.all_downtime.filter(d => d.category === categoryFilter);

                if (filteredDowntime.length === 0) return null;

                return (
                  <div key={machine.machine_id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div
                      className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between"
                      onClick={() => toggleExpand(machine.machine_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{machine.machine_name}</h4>
                          <p className="text-sm text-slate-500">
                            {filteredDowntime.length} downtime • Total: {filteredDowntime.reduce((s, d) => s + d.duration_minutes, 0)} menit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {machine.operators.length > 0 ? machine.operators.join(', ') : '-'}
                          </span>
                        </div>
                        {expandedMachine === machine.machine_id ? (
                          <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {expandedMachine === machine.machine_id && (
                      <div className="p-4 border-t border-slate-200 space-y-4">
                        {/* Top 3 Downtime Mesin */}
                        {(() => {
                          const mesinDowntime = filteredDowntime
                            .filter(d => d.category === 'mesin')
                            .sort((a, b) => b.duration_minutes - a.duration_minutes)
                            .slice(0, 3);

                          if (mesinDowntime.length === 0) return null;

                          return (
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                              <h5 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                Top {mesinDowntime.length} Downtime Mesin
                              </h5>
                              <div className="grid grid-cols-3 gap-3">
                                {mesinDowntime.map((dt, idx) => (
                                  <div key={idx} className="bg-white rounded-lg p-3 border border-red-200 shadow-sm relative">
                                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                                      {idx + 1}
                                    </div>
                                    <p className="font-semibold text-slate-800 text-sm mt-1">{dt.reason}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-slate-500">Shift {dt.shift}</span>
                                      <span className="font-bold text-red-600 text-sm">{dt.duration_minutes} menit</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-slate-400">{dt.product_name || '-'}</span>
                                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">{dt.pic || '-'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Downtime per Shift */}
                        {(() => {
                          const shifts = [...new Set(filteredDowntime.map(d => d.shift))].sort();
                          const shiftColors: Record<number, string> = {
                            1: 'from-blue-500 to-blue-600',
                            2: 'from-green-500 to-green-600',
                            3: 'from-purple-500 to-purple-600'
                          };

                          return shifts.map(shiftNum => {
                            const shiftItems = filteredDowntime
                              .filter(d => d.shift === shiftNum)
                              .sort((a, b) => b.duration_minutes - a.duration_minutes);
                            const totalMin = shiftItems.reduce((s, d) => s + d.duration_minutes, 0);

                            return (
                              <div key={shiftNum} className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className={`px-4 py-2 bg-gradient-to-r ${shiftColors[shiftNum] || 'from-slate-500 to-slate-600'} text-white flex items-center justify-between`}>
                                  <span className="font-semibold text-sm">Shift {shiftNum}</span>
                                  <span className="text-xs opacity-90">{shiftItems.length} downtime • {totalMin} menit</span>
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-slate-500 border-b bg-slate-50">
                                      <th className="px-4 py-2 font-medium">#</th>
                                      <th className="px-4 py-2 font-medium">Alasan</th>
                                      <th className="px-4 py-2 font-medium">Kategori</th>
                                      <th className="px-4 py-2 font-medium">Durasi</th>
                                      <th className="px-4 py-2 font-medium">PIC</th>
                                      <th className="px-4 py-2 font-medium">Produk</th>
                                      <th className="px-4 py-2 font-medium">WO</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {shiftItems.map((dt, idx) => (
                                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-400 text-xs">{idx + 1}</td>
                                        <td className="px-4 py-2 font-medium text-slate-700">{dt.reason}</td>
                                        <td className="px-4 py-2">
                                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(dt.category)}`}>
                                            {getCategoryLabel(dt.category)}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2">
                                          <span className="font-bold text-red-600">{dt.duration_minutes} menit</span>
                                        </td>
                                        <td className="px-4 py-2">
                                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                            {dt.pic || '-'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-500 text-xs">{dt.product_name || '-'}</td>
                                        <td className="px-4 py-2 text-blue-600 text-xs">{dt.wo_number || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeSubTab === 'timeline' && (
          <div className="space-y-4">
            {machines.map((machine) => (
              <div key={machine.machine_id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-semibold text-slate-800">{machine.machine_name}</h4>
                </div>
                <div className="p-4">
                  {/* Timeline Visual */}
                  <div className="relative">
                    {/* Time axis */}
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>06:30</span>
                      <span>15:00</span>
                      <span>23:00</span>
                      <span>06:30</span>
                    </div>

                    {/* Timeline bar */}
                    <div className="h-12 bg-slate-100 rounded-lg flex overflow-hidden">
                      {machine.timeline.map((entry, idx) => {
                        const shiftWidth = entry.shift === 1 ? '35.4%' : entry.shift === 2 ? '33.3%' : '31.3%';
                        const shiftColors = {
                          1: 'bg-blue-500',
                          2: 'bg-green-500',
                          3: 'bg-purple-500'
                        };
                        return (
                          <div
                            key={idx}
                            className={`${shiftColors[entry.shift as keyof typeof shiftColors]} relative group cursor-pointer`}
                            style={{ width: shiftWidth }}
                            title={`Shift ${entry.shift}: ${entry.product_name} - ${entry.output} pcs`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                              S{entry.shift}: {entry.output.toLocaleString()}
                            </div>
                            {/* Downtime indicator */}
                            {entry.downtime > 0 && (
                              <div
                                className="absolute bottom-0 left-0 bg-red-500 h-2"
                                style={{ width: `${Math.min(100, (entry.downtime / 60) * 100)}%` }}
                                title={`Downtime: ${entry.downtime}m`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Shift 1</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Shift 2</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                        <span>Shift 3</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Downtime</span>
                      </div>
                    </div>
                  </div>

                  {/* Detail Table */}
                  <table className="w-full text-sm mt-4">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th className="pb-2 font-medium">Shift</th>
                        <th className="pb-2 font-medium">Waktu</th>
                        <th className="pb-2 font-medium">Produk</th>
                        <th className="pb-2 font-medium">Output</th>
                        <th className="pb-2 font-medium">Grade A</th>
                        <th className="pb-2 font-medium">Down</th>
                        <th className="pb-2 font-medium">Idle</th>
                        <th className="pb-2 font-medium">Operator</th>
                        <th className="pb-2 font-medium">Supervisor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machine.timeline.map((entry, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                              Shift {entry.shift}
                            </span>
                          </td>
                          <td className="py-2 text-slate-600">{entry.start_time} - {entry.end_time}</td>
                          <td className="py-2 font-medium text-slate-700">{entry.product_name}</td>
                          <td className="py-2 font-bold text-slate-800">{entry.output.toLocaleString()}</td>
                          <td className="py-2 text-green-600 font-medium">{entry.grade_a.toLocaleString()}</td>
                          <td className="py-2 text-red-600">{entry.downtime}m</td>
                          <td className="py-2 text-orange-600">{entry.idle}m</td>
                          <td className="py-2 text-slate-600">{entry.operator || '-'}</td>
                          <td className="py-2 text-slate-600">{entry.supervisor || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Work Orders Tab */}
        {activeSubTab === 'workorders' && (
          <div className="space-y-4">
            {/* Derive WO data from summaryData if workOrders is empty */}
            {(() => {
              // Build WO list from summaryData (parent data)
              const derivedWOs: Array<{
                wo_number: string;
                machine_name: string;
                product_name: string;
                shifts: number[];
                total_output: number;
                grade_a: number;
                efficiency: number;
                efficiency_waktu: number;
              }> = [];

              if (summaryData) {
                const woMap = new Map<string, typeof derivedWOs[0]>();
                summaryData.forEach(m => {
                  m.shifts.forEach(s => {
                    if (s.wo_number) {
                      // Get efficiency from shift_summaries if available
                      const shiftSummary = m.shift_summaries?.find(ss => ss.shift === s.shift);
                      const machineEff = shiftSummary?.machine_efficiency ?? m.machine_efficiency ?? 0;
                      const waktuEff = shiftSummary?.efficiency ?? m.efficiency ?? 0;

                      if (!woMap.has(s.wo_number)) {
                        woMap.set(s.wo_number, {
                          wo_number: s.wo_number,
                          machine_name: m.machine_name,
                          product_name: s.product_name || 'Unknown',
                          shifts: [s.shift],
                          total_output: shiftSummary?.total_output ?? 0,
                          grade_a: shiftSummary?.grade_a ?? 0,
                          efficiency: machineEff,
                          efficiency_waktu: waktuEff
                        });
                      } else {
                        const existing = woMap.get(s.wo_number)!;
                        if (!existing.shifts.includes(s.shift)) {
                          existing.shifts.push(s.shift);
                          // Accumulate from shift summary
                          existing.total_output += shiftSummary?.total_output ?? 0;
                          existing.grade_a += shiftSummary?.grade_a ?? 0;
                        }
                      }
                    }
                  });
                  // Only accumulate if no shift_summaries (fallback)
                  if (!m.shift_summaries || m.shift_summaries.length === 0) {
                    woMap.forEach((wo) => {
                      if (m.shifts.some(s => s.wo_number === wo.wo_number)) {
                        wo.total_output += m.total_output;
                        wo.grade_a += m.total_grade_a;
                      }
                    });
                  }
                });
                derivedWOs.push(...woMap.values());
              }

              const displayWOs = workOrders.length > 0 ? workOrders : null;
              const displayDerivedWOs = derivedWOs.length > 0 ? derivedWOs : null;

              if (!displayWOs && !displayDerivedWOs) {
                return (
                  <div className="text-center py-8 text-slate-500">
                    Tidak ada Work Order pada tanggal ini
                  </div>
                );
              }

              // Show derived WOs from summaryData
              if (displayDerivedWOs && !displayWOs) {
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b bg-slate-50">
                          <th className="p-3 font-medium">WO Number</th>
                          <th className="p-3 font-medium">Mesin</th>
                          <th className="p-3 font-medium">Produk</th>
                          <th className="p-3 font-medium">Total Output</th>
                          <th className="p-3 font-medium">Grade A</th>
                          <th className="p-3 font-medium">Eff. Mesin</th>
                          <th className="p-3 font-medium">Eff. Waktu</th>
                          <th className="p-3 font-medium">Shifts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayDerivedWOs.map((wo, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3">
                              <span className="font-medium text-blue-600">{wo.wo_number}</span>
                            </td>
                            <td className="p-3 text-slate-700">{wo.machine_name}</td>
                            <td className="p-3 font-medium text-slate-800">{wo.product_name}</td>
                            <td className="p-3 font-bold text-slate-800">{wo.total_output.toLocaleString()}</td>
                            <td className="p-3 text-green-600 font-medium">{wo.grade_a.toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${wo.efficiency >= 100 ? 'bg-green-100 text-green-700' :
                                wo.efficiency >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {wo.efficiency}%
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${wo.efficiency_waktu >= 100 ? 'bg-green-100 text-green-700' :
                                wo.efficiency_waktu >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {wo.efficiency_waktu}%
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                {wo.shifts.sort().map(s => (
                                  <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-xs">S{s}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // Original workOrders display
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b bg-slate-50">
                        <th className="p-3 font-medium">WO Number</th>
                        <th className="p-3 font-medium">Mesin</th>
                        <th className="p-3 font-medium">Produk</th>
                        <th className="p-3 font-medium">Target</th>
                        <th className="p-3 font-medium">Actual</th>
                        <th className="p-3 font-medium">Good</th>
                        <th className="p-3 font-medium">Reject</th>
                        <th className="p-3 font-medium">Rework</th>
                        <th className="p-3 font-medium">Efficiency</th>
                        <th className="p-3 font-medium">Quality</th>
                        <th className="p-3 font-medium">Shifts</th>
                        <th className="p-3 font-medium">Operators</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((wo) => (
                        <tr key={wo.wo_id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3">
                            <span className="font-medium text-blue-600">{wo.wo_number}</span>
                          </td>
                          <td className="p-3 text-slate-700">{wo.machine_name}</td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{wo.product_name}</div>
                            {wo.product_code && (
                              <div className="text-xs text-slate-400">{wo.product_code}</div>
                            )}
                          </td>
                          <td className="p-3 font-medium">{wo.target_quantity.toLocaleString()}</td>
                          <td className="p-3 font-bold text-slate-800">{wo.actual_quantity.toLocaleString()}</td>
                          <td className="p-3 text-green-600 font-medium">{wo.good_quantity.toLocaleString()}</td>
                          <td className="p-3 text-red-600">{wo.reject_quantity.toLocaleString()}</td>
                          <td className="p-3 text-yellow-600">{wo.rework_quantity.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${wo.efficiency >= 100 ? 'bg-green-100 text-green-700' :
                              wo.efficiency >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {wo.efficiency}%
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${wo.quality_rate >= 95 ? 'bg-green-100 text-green-700' :
                              wo.quality_rate >= 85 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {wo.quality_rate}%
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {wo.shifts_worked.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-xs">S{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-slate-600">
                            {wo.operators.length > 0 ? wo.operators.join(', ') : '-'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(wo.status)}`}>
                              {wo.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyControllerDetail;
