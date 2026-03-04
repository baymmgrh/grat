import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  UserIcon,
  CubeIcon,
  SwatchIcon,
  EllipsisHorizontalCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface ShiftProduction {
  id: number;
  production_date: string;
  shift: string;
  good_quantity: number;
  downtime_minutes: number;
  downtime_mesin: number;
  downtime_operator: number;
  downtime_material: number;
  downtime_design: number;
  downtime_others: number;
  issues: string;
  machine_speed: number;
  average_time?: number;
  runtime?: number;
  planned_runtime?: number;
  actual_runtime?: number;
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
}

interface DowntimeCategory {
  category: string;
  label: string;
  totalMinutes: number;
  percentage: number;
  color: string;
  bgColor: string;
  icon: any;
  items: { reason: string; minutes: number; date: string; shift: string }[];
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  mesin: { label: 'Mesin', color: 'text-red-600', bgColor: 'bg-red-100', icon: CogIcon },
  operator: { label: 'Operator', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: UserIcon },
  material: { label: 'Material', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: CubeIcon },
  design: { label: 'Design', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: SwatchIcon },
  others: { label: 'Others', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: EllipsisHorizontalCircleIcon }
};

export default function WorkOrderBreakdown() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [shiftProductions, setShiftProductions] = useState<ShiftProduction[]>([]);
  const [categories, setCategories] = useState<DowntimeCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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
      
      // Build breakdown analysis
      buildBreakdown(productions);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data breakdown');
    } finally {
      setLoading(false);
    }
  };

  const buildBreakdown = (productions: ShiftProduction[]) => {
    const categoryData: Record<string, DowntimeCategory> = {};
    
    // Initialize categories
    Object.entries(CATEGORY_CONFIG).forEach(([key, config]) => {
      categoryData[key] = {
        category: key,
        label: config.label,
        totalMinutes: 0,
        percentage: 0,
        color: config.color,
        bgColor: config.bgColor,
        icon: config.icon,
        items: []
      };
    });
    
    // Aggregate from shift productions
    productions.forEach(sp => {
      // Add category totals
      if (sp.downtime_mesin) categoryData.mesin.totalMinutes += sp.downtime_mesin;
      if (sp.downtime_operator) categoryData.operator.totalMinutes += sp.downtime_operator;
      if (sp.downtime_material) categoryData.material.totalMinutes += sp.downtime_material;
      if (sp.downtime_design) categoryData.design.totalMinutes += sp.downtime_design;
      if (sp.downtime_others) categoryData.others.totalMinutes += sp.downtime_others;
      
      // Parse issues for detailed breakdown
      if (sp.issues) {
        const parts = sp.issues.split(';');
        parts.forEach(part => {
          const match = part.trim().match(/(\d+)\s*menit\s*-\s*(.+?)\s*\[(\w+)\]/);
          if (match) {
            const minutes = parseInt(match[1]);
            const reason = match[2].trim();
            const category = match[3].toLowerCase();
            
            if (categoryData[category]) {
              categoryData[category].items.push({
                reason,
                minutes,
                date: sp.production_date,
                shift: sp.shift?.replace('shift_', 'Shift ') || '-'
              });
            }
          }
        });
      }
    });
    
    // Calculate total and percentages
    const totalDowntime = Object.values(categoryData).reduce((sum, cat) => sum + cat.totalMinutes, 0);
    
    Object.values(categoryData).forEach(cat => {
      cat.percentage = totalDowntime > 0 ? (cat.totalMinutes / totalDowntime * 100) : 0;
      // Sort items by minutes descending
      cat.items.sort((a, b) => b.minutes - a.minutes);
    });
    
    // Sort categories by total minutes descending
    const sortedCategories = Object.values(categoryData)
      .filter(cat => cat.totalMinutes > 0)
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    setCategories(sortedCategories);
  };

  // Calculate totals
  const totals = shiftProductions.reduce((acc, sp) => {
    const runtime = sp.runtime || sp.actual_runtime || 0;
    const avgTime = sp.average_time || sp.planned_runtime || 510;
    
    return {
      gradeA: acc.gradeA + (sp.good_quantity || 0),
      totalRuntime: acc.totalRuntime + runtime,
      totalDowntime: acc.totalDowntime + (sp.downtime_minutes || 0),
      totalAvgTime: acc.totalAvgTime + avgTime,
      shifts: acc.shifts + 1
    };
  }, { gradeA: 0, totalRuntime: 0, totalDowntime: 0, totalAvgTime: 0, shifts: 0 });

  const totalCategoryDowntime = categories.reduce((sum, cat) => sum + cat.totalMinutes, 0);
  
  // Calculate potential production loss
  const avgMachineSpeed = shiftProductions.length > 0
    ? shiftProductions.reduce((sum, sp) => sum + (sp.machine_speed || 0), 0) / shiftProductions.length
    : 0;
  
  const potentialLoss = Math.round(totals.totalDowntime * avgMachineSpeed);

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
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
              Breakdown Analysis
            </h1>
            <p className="text-gray-600">{workOrder.wo_number} - {workOrder.product_name}</p>
          </div>
        </div>
        <Link
          to={`/app/production/work-orders/${id}/timeline`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <ClockIcon className="h-5 w-5" />
          Timeline
        </Link>
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Impact Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-orange-100 text-sm">Total Downtime</p>
            <p className="text-3xl font-bold">{totals.totalDowntime} menit</p>
            <p className="text-orange-200 text-sm">= {(totals.totalDowntime / 60).toFixed(1)} jam</p>
          </div>
          <div>
            <p className="text-orange-100 text-sm">Potensi Produksi Hilang</p>
            <p className="text-3xl font-bold">{potentialLoss.toLocaleString()} pcs</p>
            <p className="text-orange-200 text-sm">@ {avgMachineSpeed.toFixed(0)} pcs/menit</p>
          </div>
          <div>
            <p className="text-orange-100 text-sm">Waktu Tidak Tercatat</p>
            <p className="text-3xl font-bold">{Math.max(0, totals.totalAvgTime - totals.totalRuntime - totals.totalDowntime)} menit</p>
            <p className="text-orange-200 text-sm">dari {totals.totalAvgTime} menit</p>
          </div>
          <div>
            <p className="text-orange-100 text-sm">Loss Rate</p>
            <p className="text-3xl font-bold">
              {totals.totalAvgTime > 0 ? ((totals.totalDowntime / totals.totalAvgTime) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-orange-200 text-sm">dari total waktu</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Category</h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Tidak ada data downtime tercatat</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isExpanded = expandedCategory === cat.category;
              
              return (
                <div key={cat.category} className="border rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                    className={`w-full p-4 flex items-center justify-between ${cat.bgColor} hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-white ${cat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className={`font-semibold ${cat.color}`}>{cat.label}</h3>
                        <p className="text-sm text-gray-600">{cat.items.length} entries tercatat</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${cat.color}`}>{cat.totalMinutes} menit</p>
                      <p className="text-sm text-gray-600">{cat.percentage.toFixed(1)}% dari total</p>
                    </div>
                  </button>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-200">
                    <div 
                      className={`h-full ${cat.bgColor.replace('100', '500')}`}
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && cat.items.length > 0 && (
                    <div className="p-4 bg-white border-t">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pb-2">Alasan</th>
                            <th className="pb-2 text-center">Tanggal</th>
                            <th className="pb-2 text-center">Shift</th>
                            <th className="pb-2 text-right">Durasi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.items.map((item, idx) => (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="py-2 text-gray-700">{item.reason}</td>
                              <td className="py-2 text-center text-gray-600">
                                {new Date(item.date).toLocaleDateString('id-ID')}
                              </td>
                              <td className="py-2 text-center text-gray-600">{item.shift}</td>
                              <td className={`py-2 text-right font-medium ${cat.color}`}>
                                {item.minutes} menit
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 font-semibold">
                            <td className="pt-2" colSpan={3}>Total {cat.label}</td>
                            <td className={`pt-2 text-right ${cat.color}`}>{cat.totalMinutes} menit</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Downtime</h2>
        
        {totalCategoryDowntime > 0 ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Pie Chart Visual */}
            <div className="flex-1">
              <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {(() => {
                    let cumulativePercent = 0;
                    return categories.map((cat, idx) => {
                      const percent = cat.percentage;
                      const strokeDasharray = `${percent} ${100 - percent}`;
                      const strokeDashoffset = -cumulativePercent;
                      cumulativePercent += percent;
                      
                      const colors: Record<string, string> = {
                        mesin: '#dc2626',
                        operator: '#ea580c',
                        material: '#ca8a04',
                        design: '#9333ea',
                        others: '#6b7280'
                      };
                      
                      return (
                        <circle
                          key={cat.category}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={colors[cat.category] || '#6b7280'}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-700">{totalCategoryDowntime}</p>
                    <p className="text-xs text-gray-500">menit</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex-1">
              <div className="space-y-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${cat.bgColor.replace('100', '500')}`}></div>
                        <Icon className={`h-4 w-4 ${cat.color}`} />
                        <span className="text-sm text-gray-700">{cat.label}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${cat.color}`}>{cat.totalMinutes}m</span>
                        <span className="text-gray-500 text-sm ml-2">({cat.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada data untuk ditampilkan</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {categories.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Rekomendasi Perbaikan
          </h2>
          <div className="space-y-3">
            {categories.slice(0, 3).map((cat, idx) => {
              const recommendations: Record<string, string> = {
                mesin: 'Lakukan preventive maintenance rutin dan cek kondisi mesin sebelum shift dimulai.',
                operator: 'Tingkatkan training operator dan pastikan SOP diikuti dengan benar.',
                material: 'Koordinasi dengan PPIC untuk memastikan material tersedia tepat waktu.',
                design: 'Review desain produk dan koordinasi dengan tim R&D untuk perbaikan.',
                others: 'Analisis lebih lanjut untuk mengidentifikasi penyebab spesifik.'
              };
              
              return (
                <div key={cat.category} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-yellow-800">
                      {cat.label}: {cat.totalMinutes} menit ({cat.percentage.toFixed(1)}%)
                    </p>
                    <p className="text-sm text-yellow-700">{recommendations[cat.category]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
