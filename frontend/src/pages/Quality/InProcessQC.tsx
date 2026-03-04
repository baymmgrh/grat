import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ProductionProcess {
  id: number;
  wo_number: string;
  product_code: string;
  product_name: string;
  machine_name: string;
  operator_name: string;
  shift: number;
  production_date: string;
  current_output: number;
  target_output: number;
  uom: string;
  qc_status: 'pending' | 'inspecting' | 'passed' | 'warning' | 'critical';
  last_inspection?: string;
  defect_rate?: number;
}

interface IPQCFormData {
  checkpoint: string;
  parameter_checks: {
    name: string;
    target: string;
    actual: string;
    status: 'ok' | 'warning' | 'critical';
  }[];
  visual_check: 'passed' | 'failed';
  process_compliance: 'compliant' | 'minor_deviation' | 'major_deviation';
  sample_qty: number;
  defect_qty: number;
  defect_types: string[];
  corrective_action: string;
  notes: string;
  result: 'passed' | 'warning' | 'critical';
}

const CHECKPOINTS = [
  { value: 'material_loading', label: 'Loading Material' },
  { value: 'mixing', label: 'Mixing / Pencampuran' },
  { value: 'forming', label: 'Forming / Pembentukan' },
  { value: 'cutting', label: 'Cutting / Pemotongan' },
  { value: 'folding', label: 'Folding / Pelipatan' },
  { value: 'sealing', label: 'Sealing' },
  { value: 'packaging', label: 'Packaging Primer' },
  { value: 'labeling', label: 'Labeling' },
];

const DEFECT_TYPES = [
  'Dimensi tidak sesuai',
  'Warna tidak merata',
  'Kotoran/kontaminasi',
  'Sobek/robek',
  'Lipatan tidak rapi',
  'Seal tidak sempurna',
  'Label salah posisi',
  'Berat tidak sesuai',
];

export default function InProcessQC() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProcess, setSelectedProcess] = useState<ProductionProcess | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<IPQCFormData>({
    checkpoint: 'forming',
    parameter_checks: [
      { name: 'Suhu Mesin', target: '180°C', actual: '', status: 'ok' },
      { name: 'Kecepatan', target: '100 rpm', actual: '', status: 'ok' },
      { name: 'Tekanan', target: '5 bar', actual: '', status: 'ok' },
    ],
    visual_check: 'passed',
    process_compliance: 'compliant',
    sample_qty: 10,
    defect_qty: 0,
    defect_types: [],
    corrective_action: '',
    notes: '',
    result: 'passed',
  });

  useEffect(() => {
    fetchProductionProcesses();
  }, [filterStatus]);

  const fetchProductionProcesses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quality/in-process?status=${filterStatus}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProcesses(data.processes || []);
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Gagal memuat data proses');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = (process: ProductionProcess) => {
    setSelectedProcess(process);
    setFormData({
      checkpoint: 'forming',
      parameter_checks: [
        { name: 'Suhu Mesin', target: '180°C', actual: '', status: 'ok' },
        { name: 'Kecepatan', target: '100 rpm', actual: '', status: 'ok' },
        { name: 'Tekanan', target: '5 bar', actual: '', status: 'ok' },
      ],
      visual_check: 'passed',
      process_compliance: 'compliant',
      sample_qty: 10,
      defect_qty: 0,
      defect_types: [],
      corrective_action: '',
      notes: '',
      result: 'passed',
    });
    setShowInspectionModal(true);
  };

  const handleSubmitInspection = async () => {
    if (!selectedProcess) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quality/in-process/${selectedProcess.id}/inspect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('IPQC berhasil disimpan!');
        setShowInspectionModal(false);
        fetchProductionProcesses();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Gagal menyimpan inspeksi');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast.error('Gagal menyimpan inspeksi');
    } finally {
      setSubmitting(false);
    }
  };

  const updateParameterCheck = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      parameter_checks: prev.parameter_checks.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const toggleDefectType = (defect: string) => {
    setFormData(prev => ({
      ...prev,
      defect_types: prev.defect_types.includes(defect)
        ? prev.defect_types.filter(d => d !== defect)
        : [...prev.defect_types, defect]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            OK
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Perhatian
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3.5 h-3.5" />
            Kritis
          </span>
        );
      case 'inspecting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <BeakerIcon className="w-3.5 h-3.5" />
            Sedang Inspeksi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-3.5 h-3.5" />
            Belum Dicek
          </span>
        );
    }
  };

  const filteredProcesses = processes.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.machine_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CogIcon className="w-7 h-7 text-purple-600" />
            QC Dalam Proses (IPQC)
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Pemantauan kualitas real-time di lini produksi
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {processes.length}
              </p>
              <p className="text-sm text-gray-500">Mesin Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {processes.filter(p => p.qc_status === 'passed').length}
              </p>
              <p className="text-sm text-gray-500">Status OK</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {processes.filter(p => p.qc_status === 'warning').length}
              </p>
              <p className="text-sm text-gray-500">Perlu Perhatian</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {processes.filter(p => p.qc_status === 'critical').length}
              </p>
              <p className="text-sm text-gray-500">Kritis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {['all', 'pending', 'passed', 'warning', 'critical'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'Semua' :
                 status === 'pending' ? 'Belum Dicek' :
                 status === 'passed' ? 'OK' :
                 status === 'warning' ? 'Perhatian' : 'Kritis'}
              </button>
            ))}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari WO, produk, mesin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Process Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CogIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Tidak ada proses yang sedang berjalan</p>
          </div>
        ) : (
          filteredProcesses.map(process => (
            <div 
              key={process.id} 
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                process.qc_status === 'critical' ? 'border-red-300 dark:border-red-700' :
                process.qc_status === 'warning' ? 'border-yellow-300 dark:border-yellow-700' :
                process.qc_status === 'passed' ? 'border-green-300 dark:border-green-700' :
                'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{process.machine_name}</p>
                  <p className="text-sm text-gray-500">{process.wo_number}</p>
                </div>
                {getStatusBadge(process.qc_status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CubeIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{process.product_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{process.operator_name} - Shift {process.shift}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ChartBarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Output: {process.current_output.toLocaleString()} / {process.target_output.toLocaleString()} {process.uom}
                  </span>
                </div>
                {process.defect_rate !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExclamationTriangleIcon className={`w-4 h-4 ${process.defect_rate > 2 ? 'text-red-500' : 'text-gray-400'}`} />
                    <span className={process.defect_rate > 2 ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                      Defect Rate: {process.defect_rate}%
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((process.current_output / process.target_output) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((process.current_output / process.target_output) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {process.last_inspection && (
                <p className="text-xs text-gray-500 mb-3">
                  <ClockIcon className="w-3.5 h-3.5 inline mr-1" />
                  Inspeksi terakhir: {new Date(process.last_inspection).toLocaleString('id-ID')}
                </p>
              )}

              <button
                onClick={() => handleInspect(process)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <BeakerIcon className="w-4 h-4" />
                Inspeksi IPQC
              </button>
            </div>
          ))
        )}
      </div>

      {/* Inspection Modal */}
      {showInspectionModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BeakerIcon className="w-6 h-6 text-purple-600" />
                IPQC - {selectedProcess.machine_name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {selectedProcess.wo_number} - {selectedProcess.product_name}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Checkpoint Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Checkpoint Inspeksi
                </label>
                <select
                  value={formData.checkpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkpoint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CHECKPOINTS.map(cp => (
                    <option key={cp.value} value={cp.value}>{cp.label}</option>
                  ))}
                </select>
              </div>

              {/* Parameter Checks */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Parameter Proses</h3>
                <div className="space-y-3">
                  {formData.parameter_checks.map((param, index) => (
                    <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <label className="text-xs text-gray-500">Parameter</label>
                        <p className="font-medium text-gray-900 dark:text-white">{param.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Target</label>
                        <p className="font-medium text-gray-900 dark:text-white">{param.target}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Aktual</label>
                        <input
                          type="text"
                          value={param.actual}
                          onChange={(e) => updateParameterCheck(index, 'actual', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Masukkan nilai"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Status</label>
                        <select
                          value={param.status}
                          onChange={(e) => updateParameterCheck(index, 'status', e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm font-medium ${
                            param.status === 'ok' ? 'border-green-300 bg-green-50 text-green-700' :
                            param.status === 'warning' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                            'border-red-300 bg-red-50 text-red-700'
                          }`}
                        >
                          <option value="ok">OK</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual & Compliance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visual Check
                  </label>
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer ${
                      formData.visual_check === 'passed' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-green-300'
                    }`}>
                      <input
                        type="radio"
                        checked={formData.visual_check === 'passed'}
                        onChange={() => setFormData(prev => ({ ...prev, visual_check: 'passed' }))}
                        className="sr-only"
                      />
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>OK</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer ${
                      formData.visual_check === 'failed' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 hover:border-red-300'
                    }`}>
                      <input
                        type="radio"
                        checked={formData.visual_check === 'failed'}
                        onChange={() => setFormData(prev => ({ ...prev, visual_check: 'failed' }))}
                        className="sr-only"
                      />
                      <XCircleIcon className="w-5 h-5" />
                      <span>NG</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kepatuhan SOP
                  </label>
                  <select
                    value={formData.process_compliance}
                    onChange={(e) => setFormData(prev => ({ ...prev, process_compliance: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="compliant">Sesuai SOP</option>
                    <option value="minor_deviation">Penyimpangan Minor</option>
                    <option value="major_deviation">Penyimpangan Major</option>
                  </select>
                </div>
              </div>

              {/* Sampling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jumlah Sampel
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sample_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, sample_qty: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Defect Ditemukan
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defect_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, defect_qty: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Defect Types */}
              {formData.defect_qty > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jenis Defect
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFECT_TYPES.map(defect => (
                      <label
                        key={defect}
                        className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                          formData.defect_types.includes(defect)
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.defect_types.includes(defect)}
                          onChange={() => toggleDefectType(defect)}
                          className="sr-only"
                        />
                        {defect}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Corrective Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tindakan Korektif (jika diperlukan)
                </label>
                <textarea
                  rows={2}
                  value={formData.corrective_action}
                  onChange={(e) => setFormData(prev => ({ ...prev, corrective_action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Jelaskan tindakan korektif yang diambil..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Catatan tambahan..."
                />
              </div>

              {/* Final Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hasil IPQC
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'passed', label: 'OK', color: 'green', icon: CheckCircleIcon },
                    { value: 'warning', label: 'PERHATIAN', color: 'yellow', icon: ExclamationTriangleIcon },
                    { value: 'critical', label: 'KRITIS', color: 'red', icon: XCircleIcon },
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.result === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={formData.result === option.value}
                        onChange={() => setFormData(prev => ({ ...prev, result: option.value as any }))}
                        className="sr-only"
                      />
                      <option.icon className="w-5 h-5" />
                      <span className="font-bold">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowInspectionModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitInspection}
                disabled={submitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Simpan IPQC
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
