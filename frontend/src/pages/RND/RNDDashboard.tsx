import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical, FolderKanban, CheckCircle2, Clock, AlertTriangle,
  ArrowRight, Beaker, FileCheck, TrendingUp, Users
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

interface DashboardData {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  projects_by_stage: Record<string, number>;
  pending_approvals: number;
  recent_experiments: any[];
  recent_conversions: any[];
}

const stageLabels: Record<string, string> = {
  'LAB_SCALE': 'Lab Scale',
  'PILOT_SCALE': 'Pilot Scale',
  'VALIDATION': 'Validation',
  'COMPLETION': 'Selesai',
  'CANCELLED': 'Dibatalkan'
};

const stageColors: Record<string, string> = {
  'LAB_SCALE': 'bg-blue-100 text-blue-800',
  'PILOT_SCALE': 'bg-yellow-100 text-yellow-800',
  'VALIDATION': 'bg-purple-100 text-purple-800',
  'COMPLETION': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800'
};

const RNDDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axiosInstance.get('/api/rnd/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">R&D Dashboard</h1>
          <p className="text-gray-500">Research & Development Management</p>
        </div>
        <Link
          to="/app/rnd/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FlaskConical className="w-4 h-4" />
          Proyek Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Proyek</p>
              <p className="text-2xl font-bold text-gray-900">{data?.total_projects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Proyek Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{data?.active_projects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{data?.completed_projects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{data?.pending_approvals || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects by Stage */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyek per Tahap</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['LAB_SCALE', 'PILOT_SCALE', 'VALIDATION', 'COMPLETION'].map((stage) => (
            <div key={stage} className="text-center p-4 bg-gray-50 rounded-lg">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${stageColors[stage]}`}>
                {stageLabels[stage]}
              </span>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data?.projects_by_stage?.[stage] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Experiments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Eksperimen Terbaru</h2>
            <Beaker className="w-5 h-5 text-gray-400" />
          </div>
          {data?.recent_experiments && data.recent_experiments.length > 0 ? (
            <div className="space-y-3">
              {data.recent_experiments.map((exp: any) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{exp.experiment_number}</p>
                    <p className="text-sm text-gray-500">{exp.trial_date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    exp.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                    exp.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    exp.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {exp.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Belum ada eksperimen</p>
          )}
        </div>

        {/* Recent Conversions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Konversi ke Produksi</h2>
            <FileCheck className="w-5 h-5 text-gray-400" />
          </div>
          {data?.recent_conversions && data.recent_conversions.length > 0 ? (
            <div className="space-y-3">
              {data.recent_conversions.map((conv: any) => (
                <div key={conv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{conv.project_number}</p>
                    <p className="text-sm text-gray-500">{conv.product_name}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(conv.conversion_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Belum ada konversi</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/app/rnd/projects"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Daftar Proyek</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          to="/app/rnd/approvals"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Approval Pending</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          to="/app/rnd/projects/new"
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Proyek Baru</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
};

export default RNDDashboard;
