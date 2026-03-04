import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

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

interface ProductData {
  product_name: string;
  quantity: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  machines: string[];
}

interface DowntimeData {
  reason: string;
  duration: number;
  frequency: number;
  category?: string;
}

interface ChartData {
  week: string;
  output: number;
  grade_a: number;
  downtime: number;
  idle: number;
  efficiency: number;
}

interface PieChartData {
  name: string;
  value: number;
}

interface MachineProductData {
  machine_name: string;
  products: {
    product_name: string;
    quantity: number;
    grade_a: number;
    grade_b: number;
    grade_c: number;
  }[];
  total_output: number;
  total_grade_a: number;
}

const MonthlyController: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [monthName, setMonthName] = useState('');
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [productsPerMachine, setProductsPerMachine] = useState<MachineProductData[]>([]);
  const [allDowntime, setAllDowntime] = useState<DowntimeData[]>([]);
  const [top10Downtime, setTop10Downtime] = useState<DowntimeData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [activeTab, setActiveTab] = useState<'machines' | 'products' | 'products_machine' | 'downtime' | 'charts'>('machines');

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/oee/monthly-controller?year=${year}&month=${month}`);
      setMachines(res.data.machines || []);
      setMonthName(res.data.month_name);
      setProducts(res.data.products_produced || []);
      setProductsPerMachine(res.data.products_per_machine || []);
      setAllDowntime(res.data.all_downtime || []);
      setTop10Downtime(res.data.top_10_downtime || []);
      setChartData(res.data.chart_data || []);
      setPieChartData(res.data.pie_chart_data || []);
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('machines')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'machines' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <CogIcon className="h-5 w-5 inline mr-2" />
          Mesin
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <CubeIcon className="h-5 w-5 inline mr-2" />
          Produk ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('products_machine')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'products_machine' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <CogIcon className="h-5 w-5 inline mr-2" />
          Per Mesin ({productsPerMachine.length})
        </button>
        <button
          onClick={() => setActiveTab('downtime')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'downtime' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
          Downtime ({allDowntime.length})
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'charts' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <ChartBarIcon className="h-5 w-5 inline mr-2" />
          Grafik
        </button>
      </div>

      {/* Machines Tab */}
      {activeTab === 'machines' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Mesin</th>
                  {getWeeks().map(week => (
                    <th key={week} className="px-3 py-3 text-center text-sm font-semibold text-slate-600">{week}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600 bg-blue-50">Rata-rata</th>
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
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-slate-800">Produk yang Diproduksi - {monthName} {year}</h3>
            <p className="text-sm text-slate-500">Total {products.length} produk, {products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()} pcs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Nama Produk</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Total Output</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Grade A</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Grade B</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Grade C</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Mesin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product, index) => (
                  <tr key={product.product_name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{product.product_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{product.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">{product.grade_a.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">{product.grade_b.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-600">{product.grade_c.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{product.machines.join(', ')}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Tidak ada data produk</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Per Machine Tab */}
      {activeTab === 'products_machine' && (
        <div className="space-y-4">
          {productsPerMachine.map((machine) => (
            <div key={machine.machine_name} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CogIcon className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-purple-800">{machine.machine_name}</h3>
                      <p className="text-sm text-purple-600">{machine.products.length} produk</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-600">Total Output</p>
                    <p className="text-xl font-bold text-purple-800">{machine.total_output.toLocaleString()} pcs</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">#</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">Nama Produk</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Total</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Grade A</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Grade B</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Grade C</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {machine.products.map((product, index) => (
                      <tr key={product.product_name} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-500">{index + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{product.product_name}</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800">{product.quantity.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-green-600">{product.grade_a.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-yellow-600">{product.grade_b.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-red-600">{product.grade_c.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {productsPerMachine.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">
              Tidak ada data produk per mesin
            </div>
          )}
        </div>
      )}

      {/* Downtime Tab */}
      {activeTab === 'downtime' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Top 10 Downtime - Single list with Unplanned/Planned badge */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-red-50">
              <h3 className="text-lg font-semibold text-red-800">Top 10 Downtime</h3>
              <p className="text-sm text-red-600">Berdasarkan durasi (menit)</p>
            </div>
            <div className="p-4">
              {(() => {
                const unplannedCategories = ['mesin', 'idle'];
                const sorted = [...top10Downtime].sort((a, b) => {
                  const aU = unplannedCategories.includes(a.category || '') ? 0 : 1;
                  const bU = unplannedCategories.includes(b.category || '') ? 0 : 1;
                  if (aU !== bU) return aU - bU;
                  return b.duration - a.duration;
                });
                return sorted.map((dt, index) => {
                  const isUnplanned = unplannedCategories.includes(dt.category || '');
                  return (
                    <div key={dt.reason} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index < 3 ? (isUnplanned ? 'bg-red-500' : 'bg-blue-500') : 'bg-slate-400'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{dt.reason}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isUnplanned ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {isUnplanned ? 'Unplanned' : 'Planned'}
                            </span>
                            <span className="text-xs text-slate-500">{dt.frequency}x kejadian</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-red-600">{dt.duration} menit</span>
                    </div>
                  );
                });
              })()}
              {top10Downtime.length === 0 && (
                <p className="text-center text-slate-500 py-4">Tidak ada data downtime</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-800">Semua Downtime</h3>
              <p className="text-sm text-slate-500">Total {allDowntime.length} jenis, {allDowntime.reduce((sum, d) => sum + d.duration, 0).toLocaleString()} menit</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">Alasan</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Durasi</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Frekuensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDowntime.map((dt) => (
                    <tr key={dt.reason} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-sm text-slate-800">{dt.reason}</td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-red-600">{dt.duration} menit</td>
                      <td className="px-4 py-2 text-right text-sm text-slate-500">{dt.frequency}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Trend Mingguan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), name]} />
                <Legend />
                <Bar yAxisId="left" dataKey="output" fill="#3b82f6" name="Output" />
                <Bar yAxisId="left" dataKey="grade_a" fill="#22c55e" name="Grade A" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribusi Top 10 Downtime</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} menit`, 'Durasi']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              Top 5 Mesin Efisien
            </h3>
            <div className="space-y-3">
              {[...machines].sort((a, b) => b.avg_efficiency - a.avg_efficiency).slice(0, 5).map((m, i) => (
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

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
              Perlu Perbaikan
            </h3>
            <div className="space-y-3">
              {[...machines].filter(m => m.avg_efficiency < m.target_efficiency).sort((a, b) => a.avg_efficiency - b.avg_efficiency).slice(0, 5).map((m) => (
                <div key={m.machine_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">!</span>
                    <span className="font-medium text-slate-700">{m.machine_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{m.avg_efficiency}%</span>
                    <span className="text-xs text-slate-400 ml-2">/ {m.target_efficiency}%</span>
                  </div>
                </div>
              ))}
              {machines.filter(m => m.avg_efficiency < m.target_efficiency).length === 0 && (
                <p className="text-center text-green-600 py-4">🎉 Semua mesin mencapai target!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyController;
