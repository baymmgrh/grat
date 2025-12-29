import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface WeeklyData {
  [week: string]: {
    grade_a: number;
    output: number;
    downtime: number;
    idle: number;
    efficiency: number;
  };
}

interface MachineData {
  machine_id: number;
  machine_name: string;
  machine_code?: string;
  target_efficiency: number;
  weekly_data: WeeklyData;
  total_grade_a: number;
  total_output: number;
  total_downtime: number;
  total_idle: number;
  avg_efficiency: number;
  quality: number;
  mrt: number;
  total_time: number;
}

const MonthlyController: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [monthName, setMonthName] = useState('');
  const [machines, setMachines] = useState<MachineData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/oee/monthly-controller?year=${year}&month=${month}`);
      setMachines(res.data.machines || []);
      setMonthName(res.data.month_name);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setMonth(newMonth);
    setYear(newYear);
  };

  const getEfficiencyColor = (efficiency: number, target: number) => {
    if (efficiency >= target) return 'text-green-600 bg-green-50';
    if (efficiency >= target * 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getWeeks = () => {
    const weeks = new Set<string>();
    machines.forEach(m => {
      Object.keys(m.weekly_data).forEach(w => weeks.add(w));
    });
    return Array.from(weeks).sort();
  };

  // Calculate summary stats
  const totalMachines = machines.length;
  const avgEfficiency = machines.length > 0 
    ? Math.round(machines.reduce((sum, m) => sum + m.avg_efficiency, 0) / machines.length * 10) / 10
    : 0;
  const machinesOnTarget = machines.filter(m => m.avg_efficiency >= m.target_efficiency).length;
  const machinesBelowTarget = totalMachines - machinesOnTarget;
  const totalOutput = machines.reduce((sum, m) => sum + m.total_output, 0);
  const totalGradeA = machines.reduce((sum, m) => sum + m.total_grade_a, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monthly Controller</h1>
          <p className="text-slate-500">Ringkasan efisiensi bulanan per mesin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/production/controller')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Daily
          </button>
          <button
            onClick={() => navigate('/app/production/weekly-controller')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Weekly
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Monthly
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-800 text-xl">
              {monthName} {year}
            </span>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Total Mesin</p>
          <p className="text-2xl font-bold text-slate-800">{totalMachines}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Rata-rata Efisiensi</p>
          <p className={`text-2xl font-bold ${avgEfficiency >= 85 ? 'text-green-600' : avgEfficiency >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgEfficiency}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            <p className="text-sm text-slate-500">On Target</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{machinesOnTarget}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            <p className="text-sm text-slate-500">Below Target</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{machinesBelowTarget}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Total Output</p>
          <p className="text-2xl font-bold text-slate-800">{totalOutput.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Total Grade A</p>
          <p className="text-2xl font-bold text-green-600">{totalGradeA.toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Mesin</th>
                {getWeeks().map(week => (
                  <th key={week} className="px-3 py-3 text-center text-sm font-semibold text-slate-600">
                    {week}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600 bg-blue-50">
                  Rata-rata
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Target</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Quality</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {machines.map((machine) => (
                <tr key={machine.machine_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CogIcon className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{machine.machine_name}</p>
                        <p className="text-xs text-slate-500">Output: {machine.total_output.toLocaleString()}</p>
                      </div>
                    </div>
                  </td>
                  {getWeeks().map(week => {
                    const weekData = machine.weekly_data[week];
                    return (
                      <td key={week} className="px-3 py-3 text-center">
                        {weekData ? (
                          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getEfficiencyColor(weekData.efficiency, machine.target_efficiency)}`}>
                            {weekData.efficiency}%
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center bg-blue-50">
                    <span className={`inline-block px-3 py-1 rounded-lg text-lg font-bold ${getEfficiencyColor(machine.avg_efficiency, machine.target_efficiency)}`}>
                      {machine.avg_efficiency}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-600">{machine.target_efficiency}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${machine.quality >= 95 ? 'text-green-600' : machine.quality >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {machine.quality}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {machine.avg_efficiency >= machine.target_efficiency ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        ✓ Tercapai
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        ✗ Belum
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {machines.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data produksi bulan ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            Top 5 Mesin Efisien
          </h3>
          <div className="space-y-3">
            {[...machines]
              .sort((a, b) => b.avg_efficiency - a.avg_efficiency)
              .slice(0, 5)
              .map((m, i) => (
                <div key={m.machine_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-orange-900' : 'bg-slate-100 text-slate-600'}`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-700">{m.machine_name}</span>
                  </div>
                  <span className={`font-bold ${m.avg_efficiency >= m.target_efficiency ? 'text-green-600' : 'text-yellow-600'}`}>
                    {m.avg_efficiency}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            Perlu Perbaikan
          </h3>
          <div className="space-y-3">
            {[...machines]
              .filter(m => m.avg_efficiency < m.target_efficiency)
              .sort((a, b) => a.avg_efficiency - b.avg_efficiency)
              .slice(0, 5)
              .map((m) => (
                <div key={m.machine_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
                      !
                    </span>
                    <span className="font-medium text-slate-700">{m.machine_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{m.avg_efficiency}%</span>
                    <span className="text-xs text-slate-400 ml-2">/ {m.target_efficiency}%</span>
                  </div>
                </div>
              ))}
            {machines.filter(m => m.avg_efficiency < m.target_efficiency).length === 0 && (
              <p className="text-center text-green-600 py-4">
                🎉 Semua mesin mencapai target!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyController;
