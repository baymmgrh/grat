import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import {
  CogIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ShiftData {
  id: number;
  shift: string;
  product_name: string;
  actual_quantity: number;
  good_quantity: number;
  reject_quantity: number;
  efficiency_rate: number;
  operator_name: string;
}

interface MachineData {
  id: number;
  code: string;
  name: string;
  machine_type: string;
  status: string;
  target_efficiency: number;
  shifts: ShiftData[];
  total_output: number;
  total_good: number;
  total_reject: number;
  avg_efficiency: number;
}

interface SummaryData {
  total_machines: number;
  active_machines: number;
  total_output: number;
  total_good: number;
  total_reject: number;
  quality_rate: number;
}

const ConvertingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/converting/dashboard?date=${date}`);
      setMachines(res.data.machines || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error('Error fetching converting dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const getEfficiencyColor = (eff: number, target: number) => {
    if (eff >= target) return 'text-green-600 bg-green-100';
    if (eff >= target * 0.8) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMachineTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      perforating: 'Perforating',
      slitting: 'Slitting',
      laminasi: 'Laminasi Kain',
      bagmaker: 'Bagmaker',
      folding: 'Folding',
      cutting: 'Cutting',
    };
    return labels[type] || type;
  };

  const getMachineTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      perforating: 'bg-blue-100 text-blue-800',
      slitting: 'bg-purple-100 text-purple-800',
      laminasi: 'bg-orange-100 text-orange-800',
      bagmaker: 'bg-green-100 text-green-800',
      folding: 'bg-pink-100 text-pink-800',
      cutting: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Group machines by type
  const machinesByType = machines.reduce((acc, m) => {
    if (!acc[m.machine_type]) acc[m.machine_type] = [];
    acc[m.machine_type].push(m);
    return acc;
  }, {} as Record<string, MachineData[]>);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Converting Dashboard</h1>
          <p className="text-slate-500">Monitor produksi mesin converting</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/production/converting/input')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Input Produksi
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-white rounded-lg hover:bg-slate-50 border"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => changeDate(-1)} className="p-2 bg-white rounded-lg hover:bg-slate-50 border">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 bg-white border rounded-lg font-medium"
        />
        <button onClick={() => changeDate(1)} className="p-2 bg-white rounded-lg hover:bg-slate-50 border">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Mesin</p>
            <p className="text-2xl font-bold text-slate-800">{summary.total_machines}</p>
            <p className="text-xs text-green-600">{summary.active_machines} aktif</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Output</p>
            <p className="text-2xl font-bold text-blue-600">{summary.total_output.toLocaleString()}</p>
            <p className="text-xs text-slate-500">pcs</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500">Grade A</p>
            <p className="text-2xl font-bold text-green-600">{summary.total_good.toLocaleString()}</p>
            <p className="text-xs text-slate-500">pcs</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500">Reject</p>
            <p className="text-2xl font-bold text-red-600">{summary.total_reject.toLocaleString()}</p>
            <p className="text-xs text-slate-500">pcs</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500">Quality Rate</p>
            <p className={`text-2xl font-bold ${summary.quality_rate >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {summary.quality_rate}%
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Machines by Type */}
      {!loading && Object.entries(machinesByType).map(([type, typeMachines]) => (
        <div key={type} className="mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${getMachineTypeColor(type)}`}>
              {getMachineTypeLabel(type)}
            </span>
            <span className="text-slate-400">({typeMachines.length} mesin)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeMachines.map((machine) => (
              <div key={machine.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Machine Header */}
                <div className="p-4 border-b bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CogIcon className="h-6 w-6 text-slate-600" />
                      <div>
                        <h3 className="font-semibold text-slate-800">{machine.name}</h3>
                        <p className="text-xs text-slate-500">{machine.code}</p>
                      </div>
                    </div>
                    {machine.shifts.length > 0 ? (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEfficiencyColor(machine.avg_efficiency, machine.target_efficiency)}`}>
                        {machine.avg_efficiency}%
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-500">
                        No Data
                      </span>
                    )}
                  </div>
                </div>

                {/* Shifts */}
                <div className="p-4">
                  {machine.shifts.length > 0 ? (
                    <div className="space-y-3">
                      {machine.shifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-slate-700">{shift.shift.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-xs text-slate-500">{shift.product_name}</p>
                            {shift.operator_name && (
                              <p className="text-xs text-slate-400">Op: {shift.operator_name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">{shift.good_quantity.toLocaleString()}</p>
                            <p className={`text-xs ${shift.efficiency_rate >= machine.target_efficiency ? 'text-green-600' : 'text-yellow-600'}`}>
                              Eff: {shift.efficiency_rate}%
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Machine Total */}
                      <div className="pt-2 mt-2 border-t border-dashed">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Output:</span>
                          <span className="font-bold text-slate-800">{machine.total_output.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Grade A:</span>
                          <span className="font-bold text-green-600">{machine.total_good.toLocaleString()}</span>
                        </div>
                        {machine.total_reject > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Reject:</span>
                            <span className="font-bold text-red-600">{machine.total_reject.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400">
                      <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                      <p>Belum ada data produksi</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {!loading && machines.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CogIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Belum ada mesin converting</h3>
          <p className="text-slate-500 mb-4">Klik tombol di bawah untuk menambahkan mesin default</p>
          <button
            onClick={async () => {
              try {
                await axiosInstance.post('/api/converting/machines/seed');
                fetchData();
              } catch (error) {
                console.error('Error seeding machines:', error);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Seed 12 Mesin Converting
          </button>
        </div>
      )}
    </div>
  );
};

export default ConvertingDashboard;
