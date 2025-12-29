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

interface DailyData {
  [date: string]: {
    grade_a: number;
    output: number;
    downtime: number;
    idle: number;
    efficiency: number;
    mrt: number;
  };
}

interface MachineData {
  machine_id: number;
  machine_name: string;
  machine_code?: string;
  target_efficiency: number;
  daily_data: DailyData;
  total_grade_a: number;
  total_output: number;
  total_downtime: number;
  total_idle: number;
  avg_efficiency: number;
  quality: number;
  mrt: number;
  total_time: number;
}

const WeeklyController: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  const [weekEnd, setWeekEnd] = useState('');
  const [machines, setMachines] = useState<MachineData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/oee/weekly-controller?week_start=${weekStart}`);
      setMachines(res.data.machines || []);
      setWeekEnd(res.data.week_end);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  const changeWeek = (delta: number) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + (delta * 7));
    setWeekStart(current.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
  };

  const getEfficiencyColor = (efficiency: number, target: number) => {
    if (efficiency >= target) return 'text-green-600 bg-green-50';
    if (efficiency >= target * 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDates = () => {
    const dates = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Calculate summary stats
  const totalMachines = machines.length;
  const avgEfficiency = machines.length > 0 
    ? Math.round(machines.reduce((sum, m) => sum + m.avg_efficiency, 0) / machines.length * 10) / 10
    : 0;
  const machinesOnTarget = machines.filter(m => m.avg_efficiency >= m.target_efficiency).length;
  const machinesBelowTarget = totalMachines - machinesOnTarget;

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
          <h1 className="text-2xl font-bold text-slate-800">Weekly Controller</h1>
          <p className="text-slate-500">Ringkasan efisiensi mingguan per mesin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/production/controller')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Daily
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Weekly
          </button>
          <button
            onClick={() => navigate('/app/production/monthly-controller')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-800">
              {new Date(weekStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' - '}
              {weekEnd && new Date(weekEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Total Mesin Aktif</p>
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
            <p className="text-sm text-slate-500">Mencapai Target</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{machinesOnTarget}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            <p className="text-sm text-slate-500">Dibawah Target</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{machinesBelowTarget}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Mesin</th>
                {getDates().map(date => (
                  <th key={date} className="px-3 py-3 text-center text-sm font-semibold text-slate-600">
                    {formatDate(date)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600 bg-blue-50">
                  Rata-rata
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Target</th>
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
                        <p className="text-xs text-slate-500">{machine.machine_code}</p>
                      </div>
                    </div>
                  </td>
                  {getDates().map(date => {
                    const dayData = machine.daily_data[date];
                    return (
                      <td key={date} className="px-3 py-3 text-center">
                        {dayData ? (
                          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getEfficiencyColor(dayData.efficiency, machine.target_efficiency)}`}>
                            {dayData.efficiency}%
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
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data produksi minggu ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyController;
