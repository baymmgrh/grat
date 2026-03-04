import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface KPITarget {
  id: number;
  kpi_code: string;
  kpi_name: string;
  category: string;
  target_value: number;
  unit: string;
  warning_threshold: number;
  critical_threshold: number;
  description: string;
  is_active: boolean;
  period_type: string;
}

const KPITargetSettings: React.FC = () => {
  const { t } = useLanguage();
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<KPITarget>>({});

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/kpi-targets');
      setTargets(response.data?.data?.targets || []);
    } catch (error) {
      console.error('Failed to load KPI targets:', error);
      toast.error('Gagal memuat data KPI targets');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (target: KPITarget) => {
    setEditingId(target.id);
    setEditForm({
      target_value: target.target_value,
      warning_threshold: target.warning_threshold,
      critical_threshold: target.critical_threshold,
      description: target.description
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: number) => {
    try {
      await axiosInstance.put(`/api/kpi-targets/${id}`, editForm);
      toast.success('KPI target berhasil diupdate');
      setEditingId(null);
      setEditForm({});
      loadTargets();
    } catch (error) {
      console.error('Failed to update KPI target:', error);
      toast.error('Gagal mengupdate KPI target');
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(value);
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Financial': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Production': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Quality': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Sales': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Inventory': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const groupedTargets = targets.reduce((acc, target) => {
    if (!acc[target.category]) {
      acc[target.category] = [];
    }
    acc[target.category].push(target);
    return acc;
  }, {} as Record<string, KPITarget[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat KPI Targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="h-7 w-7 text-blue-600" />
            KPI Target Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kelola target KPI untuk Performance Scorecard
          </p>
        </div>
        <button
          onClick={loadTargets}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Tentang KPI Targets</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Target KPI digunakan untuk menghitung Performance Scorecard di Executive Dashboard. 
              Sesuaikan target dengan kondisi bisnis perusahaan Anda.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Tables by Category */}
      {Object.entries(groupedTargets).map(([category, categoryTargets]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}>
                {category}
              </span>
              <span>{categoryTargets.length} KPIs</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warning (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{target.kpi_name}</div>
                        <div className="text-sm text-gray-500">{target.kpi_code}</div>
                        {target.description && (
                          <div className="text-xs text-gray-400 mt-1">{target.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === target.id ? (
                        <input
                          type="number"
                          value={editForm.target_value || ''}
                          onChange={(e) => setEditForm({ ...editForm, target_value: parseFloat(e.target.value) })}
                          className="w-32 px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatValue(target.target_value, target.unit)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === target.id ? (
                        <input
                          type="number"
                          value={editForm.warning_threshold || ''}
                          onChange={(e) => setEditForm({ ...editForm, warning_threshold: parseFloat(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          {target.warning_threshold}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === target.id ? (
                        <input
                          type="number"
                          value={editForm.critical_threshold || ''}
                          onChange={(e) => setEditForm({ ...editForm, critical_threshold: parseFloat(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XMarkIcon className="h-4 w-4" />
                          {target.critical_threshold}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs capitalize">
                        {target.period_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === target.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(target.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Simpan"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Batal"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(target)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Keterangan Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div>
              <div className="font-medium text-green-800 dark:text-green-200">Good</div>
              <div className="text-sm text-green-600 dark:text-green-400">Achievement ≥ 100%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">Warning</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Achievement ≥ Warning Threshold</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <XMarkIcon className="h-6 w-6 text-red-600" />
            <div>
              <div className="font-medium text-red-800 dark:text-red-200">Critical</div>
              <div className="text-sm text-red-600 dark:text-red-400">Achievement &lt; Warning Threshold</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPITargetSettings;
