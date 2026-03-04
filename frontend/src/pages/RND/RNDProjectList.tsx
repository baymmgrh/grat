import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FlaskConical, Search, Filter, Plus, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

interface Project {
  id: number;
  project_number: string;
  name: string;
  project_type: string;
  priority: string;
  stage: string;
  target_product_name: string | null;
  project_leader_name: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  formula_count: number;
  is_locked: boolean;
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

const priorityLabels: Record<string, string> = {
  'low': 'Rendah',
  'medium': 'Sedang',
  'high': 'Tinggi',
  'critical': 'Kritis'
};

const priorityColors: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800',
  'critical': 'bg-red-100 text-red-800'
};

const typeLabels: Record<string, string> = {
  'new_product': 'Produk Baru',
  'improvement': 'Perbaikan',
  'cost_reduction': 'Reduksi Biaya'
};

const RNDProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, [page, search, stageFilter, typeFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(search && { search }),
        ...(stageFilter && { stage: stageFilter }),
        ...(typeFilter && { project_type: typeFilter })
      });

      const response = await axiosInstance.get(`/api/rnd/projects?${params}`);
      setProjects(response.data.projects);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;

    try {
      await axiosInstance.delete(`/api/rnd/projects/${id}`);
      fetchProjects();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus proyek');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyek R&D</h1>
          <p className="text-gray-500">Kelola proyek penelitian dan pengembangan</p>
        </div>
        <Link
          to="/app/rnd/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Proyek Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari proyek..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tahap</option>
            <option value="LAB_SCALE">Lab Scale</option>
            <option value="PILOT_SCALE">Pilot Scale</option>
            <option value="VALIDATION">Validation</option>
            <option value="COMPLETION">Selesai</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tipe</option>
            <option value="new_product">Produk Baru</option>
            <option value="improvement">Perbaikan</option>
            <option value="cost_reduction">Reduksi Biaya</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p>Tidak ada proyek ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Proyek</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahap</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioritas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formula</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link 
                        to={`/app/rnd/projects/${project.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {project.project_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{project.name}</td>
                    <td className="px-4 py-3 text-gray-600">{typeLabels[project.project_type] || project.project_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors[project.stage]}`}>
                        {stageLabels[project.stage] || project.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
                        {priorityLabels[project.priority] || project.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{project.target_product_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{project.formula_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/app/rnd/projects/${project.id}`)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!project.is_locked && (
                          <>
                            <button
                              onClick={() => navigate(`/app/rnd/projects/${project.id}/edit`)}
                              className="p-1 text-gray-500 hover:text-yellow-600"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="p-1 text-gray-500 hover:text-red-600"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Menampilkan {projects.length} dari {total} proyek
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RNDProjectList;
