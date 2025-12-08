import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import {
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

interface WeeklyPlan {
  id: number;
  plan_number: string;
  week_number: number;
  year: number;
  week_start: string;
  week_end: string;
  status: string;
  creator_name: string;
  approver_name: string | null;
  approved_at: string | null;
  total_items: number;
  total_quantity: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Menunggu Approval',
  approved: 'Approved',
  in_progress: 'Sedang Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const WeeklyProductionPlan: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlanWeek, setNewPlanWeek] = useState<number>(0);

  useEffect(() => {
    fetchCurrentWeek();
    fetchPlans();
  }, [selectedYear]);

  const fetchCurrentWeek = async () => {
    try {
      const response = await axios.get('/api/production/current-week');
      setCurrentWeek(response.data);
      setNewPlanWeek(response.data.week_number);
    } catch (error) {
      console.error('Error fetching current week:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/production/weekly-plans?year=${selectedYear}`);
      setPlans(response.data.weekly_plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      setCreating(true);
      const response = await axios.post('/api/production/weekly-plans', {
        year: selectedYear,
        week_number: newPlanWeek,
      });
      
      setShowCreateModal(false);
      navigate(`/app/production/weekly-plans/${response.data.weekly_plan.id}`);
    } catch (error: any) {
      if (error.response?.data?.existing_id) {
        navigate(`/app/production/weekly-plans/${error.response.data.existing_id}`);
      } else {
        alert(error.response?.data?.error || 'Gagal membuat plan');
      }
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return ClockIcon;
      case 'submitted': return DocumentCheckIcon;
      case 'approved': return CheckCircleIcon;
      case 'in_progress': return PlayIcon;
      case 'completed': return CheckCircleIcon;
      default: return ClockIcon;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDaysIcon className="h-7 w-7 text-blue-600" />
            Rencana Produksi Mingguan
          </h1>
          <p className="text-gray-600 mt-1">
            PPIC - Perencanaan produksi per minggu dengan cek material
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Buat Rencana Baru
        </button>
      </div>

      {/* Current Week Info */}
      {currentWeek && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Minggu Ini</p>
                <p className="font-semibold text-blue-900">
                  Minggu {currentWeek.week_number}, {currentWeek.year}
                </p>
                <p className="text-sm text-blue-700">
                  {formatDate(currentWeek.week_start)} - {formatDate(currentWeek.week_end)}
                </p>
              </div>
            </div>
            {currentWeek.existing_plan ? (
              <Link
                to={`/app/production/weekly-plans/${currentWeek.existing_plan.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lihat Rencana
              </Link>
            ) : (
              <button
                onClick={() => {
                  setNewPlanWeek(currentWeek.week_number);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Buat Rencana Minggu Ini
              </button>
            )}
          </div>
        </div>
      )}

      {/* Year Selector */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setSelectedYear(selectedYear - 1)}
          className="p-2 rounded-lg border hover:bg-gray-50"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold">{selectedYear}</span>
        <button
          onClick={() => setSelectedYear(selectedYear + 1)}
          className="p-2 rounded-lg border hover:bg-gray-50"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Plans List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada rencana produksi untuk tahun {selectedYear}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Buat Rencana Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minggu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat Oleh</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => {
                  const StatusIcon = getStatusIcon(plan.status);
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">{plan.plan_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">W{plan.week_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(plan.week_start)} - {formatDate(plan.week_end)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <CubeIcon className="h-4 w-4 text-gray-400" />
                          {plan.total_items} produk
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {plan.total_quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${STATUS_COLORS[plan.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_LABELS[plan.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {plan.creator_name}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/app/production/weekly-plans/${plan.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
              Buat Rencana Produksi Mingguan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minggu ke-</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={newPlanWeek}
                  onChange={(e) => setNewPlanWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Membuat...' : 'Buat Rencana'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyProductionPlan;
