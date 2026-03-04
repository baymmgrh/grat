import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CubeIcon,
  CogIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

interface DashboardData {
  period: {
    year: number;
    month: number;
    month_name: string;
    start_date: string;
    end_date: string;
  };
  summary: {
    target_ctn: number;
    target_pcs: number;
    actual_ctn: number;
    actual_pcs: number;
    good_pcs: number;
    reject_pcs: number;
    achievement_pct: number;
    gap_pcs: number;
    gap_ctn: number;
    quality_rate: number;
    total_downtime_minutes: number;
    total_downtime_hours: number;
  };
  downtime_by_category: {
    mesin: number;
    operator: number;
    material: number;
    design: number;
    idle: number;
    others: number;
  };
  top_downtime_reasons: Array<{
    reason: string;
    category: string;
    count: number;
    total_minutes: number;
  }>;
  products: Array<{
    product_id: number;
    product_name: string;
    target_ctn: number;
    target_pcs: number;
    actual_ctn: number;
    actual_pcs: number;
    good_pcs: number;
    reject_pcs: number;
    achievement_pct: number;
    gap_pcs: number;
    gap_ctn: number;
    quality_rate: number;
  }>;
  machines: Array<{
    machine_id: number;
    machine_name: string;
    total_produced: number;
    total_good: number;
    total_reject: number;
    total_downtime: number;
    shift_count: number;
    avg_oee: number;
    quality_rate: number;
  }>;
  daily_trend: Array<{
    date: string;
    produced: number;
    good: number;
    reject: number;
    downtime: number;
  }>;
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];
const DOWNTIME_COLORS = {
  mesin: '#EF4444',
  operator: '#F59E0B',
  material: '#3B82F6',
  design: '#8B5CF6',
  idle: '#F97316',
  others: '#6B7280'
};

const ProductionExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/executive/production-executive?year=${year}&month=${month}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        Tidak ada data tersedia
      </div>
    );
  }

  const { summary, downtime_by_category, top_downtime_reasons, products, machines, daily_trend } = data;

  // Prepare downtime pie chart data
  const downtimePieData = Object.entries(downtime_by_category)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: Math.round(value),
      color: DOWNTIME_COLORS[key as keyof typeof DOWNTIME_COLORS]
    }));

  // Achievement status
  const isOnTrack = summary.achievement_pct >= 80;
  const isCritical = summary.achievement_pct < 50;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Executive Production Dashboard</h1>
          <p className="text-gray-500">Ringkasan Target vs Aktual Produksi Bulanan</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Achievement Card */}
        <div className={`rounded-xl p-6 shadow-lg ${isCritical ? 'bg-gradient-to-br from-red-500 to-red-600' :
          isOnTrack ? 'bg-gradient-to-br from-green-500 to-green-600' :
            'bg-gradient-to-br from-yellow-500 to-yellow-600'
          } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Achievement</p>
              <p className="text-4xl font-bold">{summary.achievement_pct}%</p>
              <p className="text-sm mt-1 opacity-80">
                {isOnTrack ? '✓ On Track' : isCritical ? '⚠ Critical' : '! Behind Target'}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              {isOnTrack ? (
                <ArrowTrendingUpIcon className="h-8 w-8" />
              ) : (
                <ArrowTrendingDownIcon className="h-8 w-8" />
              )}
            </div>
          </div>
        </div>

        {/* Target vs Actual */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="font-medium text-gray-700">Target vs Aktual</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Target</span>
              <span className="font-bold text-blue-600">{summary.target_ctn.toLocaleString()} karton</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Aktual</span>
              <span className="font-bold text-green-600">{summary.actual_ctn.toLocaleString()} karton</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-500">Gap</span>
              <span className={`font-bold ${summary.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {summary.gap_ctn > 0 ? '-' : '+'}{Math.abs(summary.gap_ctn).toLocaleString()} karton
              </span>
            </div>
          </div>
        </div>

        {/* Quality Rate */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="font-medium text-gray-700">Quality Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{summary.quality_rate}%</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Good</span>
              <span className="text-green-600">{summary.good_pcs.toLocaleString()} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reject</span>
              <span className="text-red-600">{summary.reject_pcs.toLocaleString()} pcs</span>
            </div>
          </div>
        </div>

        {/* Total Downtime */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-red-600" />
            </div>
            <span className="font-medium text-gray-700">Total Downtime</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{summary.total_downtime_hours.toLocaleString()} jam</p>
          <p className="text-sm text-gray-500 mt-1">
            = {summary.total_downtime_minutes.toLocaleString()} menit
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Production Trend */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Trend Produksi Harian</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(val) => val.split('-')[2]} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Legend />
                <Area type="monotone" dataKey="produced" name="Produksi" stroke="#3B82F6" fill="#93C5FD" />
                <Area type="monotone" dataKey="good" name="Good" stroke="#10B981" fill="#A7F3D0" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Downtime by Category */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Downtime per Kategori</h3>
          <div className="h-80 flex items-center">
            {downtimePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={downtimePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}m`}
                  >
                    {downtimePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} menit`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full text-center text-gray-500">Tidak ada data downtime</div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {Object.entries(DOWNTIME_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-600 capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Downtime Reasons - Single table with Unplanned/Planned indicator */}
      {(() => {
        const unplannedCategories = ['mesin', 'idle'];
        // Sort: unplanned first, then planned, each group by total_minutes desc
        const sorted = [...top_downtime_reasons].sort((a, b) => {
          const aUnplanned = unplannedCategories.includes(a.category) ? 0 : 1;
          const bUnplanned = unplannedCategories.includes(b.category) ? 0 : 1;
          if (aUnplanned !== bUnplanned) return aUnplanned - bUnplanned;
          return b.total_minutes - a.total_minutes;
        });

        const categoryColors: Record<string, string> = {
          mesin: 'bg-red-100 text-red-700',
          operator: 'bg-yellow-100 text-yellow-700',
          material: 'bg-blue-100 text-blue-700',
          design: 'bg-purple-100 text-purple-700',
          idle: 'bg-orange-100 text-orange-700',
          others: 'bg-gray-100 text-gray-700'
        };
        const categoryLabels: Record<string, string> = {
          mesin: 'Mesin', operator: 'Operator', material: 'Material',
          design: 'Design', idle: 'Idle', others: 'Lainnya'
        };

        return (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 inline mr-2 text-red-500" />
              Top 10 Downtime
            </h3>
            {sorted.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tipe</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Alasan</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kategori</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Frekuensi</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total Waktu</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sorted.map((item, index) => {
                      const maxMinutes = sorted[0]?.total_minutes || 1;
                      const percentage = (item.total_minutes / maxMinutes) * 100;
                      const isUnplanned = unplannedCategories.includes(item.category);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isUnplanned ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {isUnplanned ? 'Unplanned' : 'Planned'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.reason}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[item.category] || categoryColors.others}`}>
                              {categoryLabels[item.category] || item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{item.count}x</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                            {item.total_minutes} menit
                          </td>
                          <td className="px-4 py-3 w-48">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${isUnplanned ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Tidak ada data downtime</p>
            )}
          </div>
        );
      })()}

      {/* Products Performance */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <CubeIcon className="h-5 w-5 inline mr-2 text-blue-500" />
          Performa per Produk (Sorted by Achievement)
        </h3>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Produk</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Target (ctn)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aktual (ctn)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Gap</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Achievement</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${product.achievement_pct < 50 ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {product.target_ctn.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {product.actual_ctn.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${product.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {product.gap_ctn > 0 ? '-' : '+'}{Math.abs(product.gap_ctn).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.achievement_pct >= 80 ? 'bg-green-100 text-green-700' :
                        product.achievement_pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {product.achievement_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {product.quality_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Tidak ada data produk</p>
        )}
      </div>

      {/* Machine Performance */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <CogIcon className="h-5 w-5 inline mr-2 text-purple-500" />
          Performa Mesin (Sorted by OEE)
        </h3>
        {machines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${machine.avg_oee >= 60 ? 'border-green-200 bg-green-50' :
                machine.avg_oee >= 40 ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{machine.machine_name}</h4>
                  <span className={`text-lg font-bold ${machine.avg_oee >= 60 ? 'text-green-600' :
                    machine.avg_oee >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                    {machine.avg_oee}% OEE
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Produksi</span>
                    <span className="font-medium">{machine.total_produced.toLocaleString()} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality</span>
                    <span className="font-medium">{machine.quality_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Downtime</span>
                    <span className="font-medium text-red-600">{machine.total_downtime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shift Count</span>
                    <span className="font-medium">{machine.shift_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Tidak ada data mesin</p>
        )}
      </div>
    </div>
  );
};

export default ProductionExecutiveDashboard;
