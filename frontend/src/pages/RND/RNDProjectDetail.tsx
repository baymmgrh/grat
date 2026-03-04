import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FlaskConical, ArrowLeft, Edit, Trash2, Plus, CheckCircle2, XCircle,
  Beaker, FileCheck, AlertTriangle, Clock, ChevronRight, Lock,
  Play, Send, CheckSquare
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

interface FormulaItem {
  id: number;
  line_number: number;
  material_name: string;
  material_code: string | null;
  quantity: number;
  uom: string;
  unit_cost: number | null;
  percentage: number | null;
  is_critical: boolean;
  total_cost: number;
}

interface Experiment {
  id: number;
  experiment_number: string;
  batch_number: string | null;
  trial_date: string;
  machine_name: string | null;
  status: string;
  quantity_produced: number | null;
  quantity_good: number | null;
  yield_percentage: number | null;
  conducted_by_name: string | null;
}

interface Formula {
  id: number;
  version: string;
  name: string | null;
  description: string | null;
  is_selected: boolean;
  is_final_candidate: boolean;
  total_estimated_cost: number | null;
  cost_per_unit: number | null;
  batch_size: number;
  batch_uom: string;
  status: string;
  item_count: number;
  experiment_count: number;
  last_experiment_status: string | null;
  items: FormulaItem[];
  experiments?: Experiment[];
}

interface Project {
  id: number;
  project_number: string;
  name: string;
  description: string | null;
  project_type: string;
  priority: string;
  stage: string;
  is_locked: boolean;
  target_product_id: number | null;
  target_product_code: string | null;
  target_product_name: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  estimated_budget: number | null;
  actual_cost: number | null;
  project_leader_name: string | null;
  created_by_name: string | null;
  created_at: string;
  formulas: Formula[];
  selected_formula: { id: number; version: string; name: string } | null;
}

const stageLabels: Record<string, string> = {
  'LAB_SCALE': 'Lab Scale',
  'PILOT_SCALE': 'Pilot Scale',
  'VALIDATION': 'Validation',
  'COMPLETION': 'Selesai',
  'CANCELLED': 'Dibatalkan'
};

const stageColors: Record<string, string> = {
  'LAB_SCALE': 'bg-blue-100 text-blue-800 border-blue-300',
  'PILOT_SCALE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'VALIDATION': 'bg-purple-100 text-purple-800 border-purple-300',
  'COMPLETION': 'bg-green-100 text-green-800 border-green-300',
  'CANCELLED': 'bg-red-100 text-red-800 border-red-300'
};

const experimentStatusColors: Record<string, string> = {
  'PENDING': 'bg-gray-100 text-gray-800',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'PASSED': 'bg-green-100 text-green-800',
  'FAILED': 'bg-red-100 text-red-800',
  'CANCELLED': 'bg-gray-100 text-gray-800'
};

const RNDProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'formulas' | 'experiments'>('overview');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showExperimentModal, setShowExperimentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/rnd/projects/${id}`);
      setProject(response.data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFormula = async (formulaId: number) => {
    try {
      await axiosInstance.post(`/api/rnd/formulas/${formulaId}/select`);
      fetchProject();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal memilih formula');
    }
  };

  const handleRequestApproval = async (notes: string) => {
    try {
      await axiosInstance.post(`/api/rnd/projects/${id}/request-approval`, { notes });
      setShowApprovalModal(false);
      alert('Permintaan approval berhasil dikirim');
      fetchProject();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengirim permintaan approval');
    }
  };

  const handleConvertToProduction = async () => {
    if (!confirm('Apakah Anda yakin ingin mengkonversi proyek ini ke BOM Produksi?')) return;

    try {
      const response = await axiosInstance.post(`/api/rnd/projects/${id}/convert-to-production`);
      alert(`Berhasil dikonversi!\nProduk: ${response.data.product.name}\nBOM: ${response.data.bom.bom_number}`);
      fetchProject();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengkonversi ke produksi');
    }
  };

  const handleDeleteFormula = async (formulaId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus formula ini?')) return;

    try {
      await axiosInstance.delete(`/api/rnd/formulas/${formulaId}`);
      fetchProject();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus formula');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="text-gray-600">Proyek tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/rnd/projects')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{project.project_number}</h1>
              {project.is_locked && (
                <Lock className="w-5 h-5 text-gray-500" title="Proyek terkunci" />
              )}
            </div>
            <p className="text-gray-500">{project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!project.is_locked && (
            <>
              <button
                onClick={() => navigate(`/app/rnd/projects/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowApprovalModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                <Send className="w-4 h-4" />
                Request Approval
              </button>
            </>
          )}
          {project.stage === 'VALIDATION' && !project.is_locked && (
            <button
              onClick={handleConvertToProduction}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileCheck className="w-4 h-4" />
              Convert to Production
            </button>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Progress Tahap</h2>
        <div className="flex items-center justify-between">
          {['LAB_SCALE', 'PILOT_SCALE', 'VALIDATION', 'COMPLETION'].map((stage, index) => (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  project.stage === stage
                    ? stageColors[stage]
                    : ['LAB_SCALE', 'PILOT_SCALE', 'VALIDATION', 'COMPLETION'].indexOf(project.stage) > index
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {['LAB_SCALE', 'PILOT_SCALE', 'VALIDATION', 'COMPLETION'].indexOf(project.stage) > index ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  project.stage === stage ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {stageLabels[stage]}
                </span>
              </div>
              {index < 3 && (
                <ChevronRight className={`w-6 h-6 ${
                  ['LAB_SCALE', 'PILOT_SCALE', 'VALIDATION', 'COMPLETION'].indexOf(project.stage) > index
                    ? 'text-green-500'
                    : 'text-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'formulas', label: `Formula (${project.formulas.length})` },
            { id: 'experiments', label: 'Eksperimen' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Informasi Proyek</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Tipe Proyek</dt>
                <dd className="font-medium">{project.project_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Prioritas</dt>
                <dd className="font-medium">{project.priority}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Target Produk</dt>
                <dd className="font-medium">{project.target_product_name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Project Leader</dt>
                <dd className="font-medium">{project.project_leader_name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tanggal Mulai</dt>
                <dd className="font-medium">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Target Selesai</dt>
                <dd className="font-medium">
                  {project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString('id-ID') : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Estimasi Budget</dt>
                <dd className="font-medium">
                  {project.estimated_budget ? `Rp ${project.estimated_budget.toLocaleString()}` : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Selected Formula */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Formula Terpilih</h3>
            {project.selected_formula ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    {project.selected_formula.version}
                  </span>
                </div>
                <p className="text-green-700">{project.selected_formula.name || 'Tanpa nama'}</p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800">Belum ada formula yang dipilih</span>
                </div>
              </div>
            )}

            {project.description && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Deskripsi</h4>
                <p className="text-gray-700">{project.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'formulas' && (
        <div className="space-y-4">
          {!project.is_locked && (
            <div className="flex justify-end">
              <Link
                to={`/app/rnd/projects/${id}/formulas/new`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Tambah Formula
              </Link>
            </div>
          )}

          {project.formulas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Belum ada formula</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {project.formulas.map((formula) => (
                <div
                  key={formula.id}
                  className={`bg-white rounded-xl shadow-sm p-6 border ${
                    formula.is_selected ? 'border-green-300 bg-green-50' : 'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{formula.version}</span>
                        {formula.is_selected && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Terpilih
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          formula.status === 'approved' ? 'bg-green-100 text-green-800' :
                          formula.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                          formula.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formula.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{formula.name || 'Tanpa nama'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!project.is_locked && !formula.is_selected && (
                        <button
                          onClick={() => handleSelectFormula(formula.id)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          Pilih
                        </button>
                      )}
                      <Link
                        to={`/app/rnd/formulas/${formula.id}`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Detail
                      </Link>
                      {!project.is_locked && !formula.is_selected && (
                        <button
                          onClick={() => handleDeleteFormula(formula.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Batch Size</p>
                      <p className="font-medium">{formula.batch_size} {formula.batch_uom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Material</p>
                      <p className="font-medium">{formula.item_count} item</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Eksperimen</p>
                      <p className="font-medium">{formula.experiment_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Est. Cost</p>
                      <p className="font-medium">
                        {formula.total_estimated_cost 
                          ? `Rp ${formula.total_estimated_cost.toLocaleString()}` 
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {formula.last_experiment_status && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500 mr-2">Eksperimen Terakhir:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${experimentStatusColors[formula.last_experiment_status]}`}>
                        {formula.last_experiment_status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'experiments' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-gray-500 text-center py-8">
            Pilih formula untuk melihat eksperimen
          </p>
        </div>
      )}

      {/* Approval Request Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Request Approval</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleRequestApproval(formData.get('notes') as string);
            }}>
              <textarea
                name="notes"
                placeholder="Catatan (opsional)"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RNDProjectDetail;
