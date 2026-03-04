import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BeakerIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  TruckIcon,
  CubeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface IncomingMaterial {
  id: number;
  po_number: string;
  supplier_name: string;
  material_code: string;
  material_name: string;
  batch_number: string;
  quantity: number;
  uom: string;
  received_date: string;
  qc_status: 'pending' | 'inspecting' | 'passed' | 'rejected' | 'conditional';
  inspector_name?: string;
  inspected_date?: string;
}

interface IncomingQCFormData {
  visual_inspection: 'passed' | 'failed';
  packaging_condition: 'good' | 'damaged' | 'acceptable';
  quantity_verified: boolean;
  sample_size: number;
  defect_found: number;
  lab_test_required: boolean;
  lab_test_result?: 'passed' | 'failed' | 'pending';
  dimension_check: 'passed' | 'failed' | 'na';
  chemical_test: 'passed' | 'failed' | 'na';
  physical_test: 'passed' | 'failed' | 'na';
  notes: string;
  result: 'passed' | 'rejected' | 'conditional';
}

export default function IncomingQC() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<IncomingMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedMaterial, setSelectedMaterial] = useState<IncomingMaterial | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<IncomingQCFormData>({
    visual_inspection: 'passed',
    packaging_condition: 'good',
    quantity_verified: true,
    sample_size: 10,
    defect_found: 0,
    lab_test_required: false,
    lab_test_result: 'pending',
    dimension_check: 'na',
    chemical_test: 'na',
    physical_test: 'na',
    notes: '',
    result: 'passed',
  });

  useEffect(() => {
    fetchIncomingMaterials();
  }, [filterStatus]);

  const fetchIncomingMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quality/incoming-materials?status=${filterStatus}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Gagal memuat data material');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = (material: IncomingMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      visual_inspection: 'passed',
      packaging_condition: 'good',
      quantity_verified: true,
      sample_size: 10,
      defect_found: 0,
      lab_test_required: false,
      lab_test_result: 'pending',
      dimension_check: 'na',
      chemical_test: 'na',
      physical_test: 'na',
      notes: '',
      result: 'passed',
    });
    setShowInspectionModal(true);
  };

  const handleSubmitInspection = async () => {
    if (!selectedMaterial) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quality/incoming-materials/${selectedMaterial.id}/inspect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Inspeksi berhasil disimpan!');
        setShowInspectionModal(false);
        fetchIncomingMaterials();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Lulus
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3.5 h-3.5" />
            Ditolak
          </span>
        );
      case 'conditional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Bersyarat
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
            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
            Menunggu QC
          </span>
        );
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowDownTrayIcon className="w-7 h-7 text-blue-600" />
            QC Barang Masuk
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Inspeksi kualitas bahan baku dan material yang diterima
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {materials.filter(m => m.qc_status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">Menunggu QC</p>
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
                {materials.filter(m => m.qc_status === 'passed').length}
              </p>
              <p className="text-sm text-gray-500">Lulus QC</p>
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
                {materials.filter(m => m.qc_status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-500">Ditolak</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {materials.filter(m => m.qc_status === 'conditional').length}
              </p>
              <p className="text-sm text-gray-500">Bersyarat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {['pending', 'passed', 'rejected', 'conditional', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'pending' ? 'Menunggu QC' :
                 status === 'passed' ? 'Lulus' :
                 status === 'rejected' ? 'Ditolak' :
                 status === 'conditional' ? 'Bersyarat' : 'Semua'}
              </button>
            ))}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari material, PO, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Materials List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <CubeIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Tidak ada material yang perlu di-QC</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PO / Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Diterima</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMaterials.map(material => (
                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{material.po_number}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <TruckIcon className="w-4 h-4" />
                        {material.supplier_name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{material.material_code}</p>
                      <p className="text-sm text-gray-500">{material.material_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">{material.batch_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {material.quantity.toLocaleString()} {material.uom}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(material.received_date).toLocaleDateString('id-ID')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(material.qc_status)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {material.qc_status === 'pending' ? (
                      <button
                        onClick={() => handleInspect(material)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <BeakerIcon className="w-4 h-4" />
                        Inspeksi
                      </button>
                    ) : (
                      <button
                        onClick={() => {/* View details */}}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Detail
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inspection Modal */}
      {showInspectionModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BeakerIcon className="w-6 h-6 text-blue-600" />
                Inspeksi QC Barang Masuk
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {selectedMaterial.material_code} - {selectedMaterial.material_name}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Material Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">PO Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.po_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Supplier</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Batch Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.batch_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedMaterial.quantity.toLocaleString()} {selectedMaterial.uom}</p>
                  </div>
                </div>
              </div>

              {/* Inspection Checklist */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Checklist Inspeksi</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visual Inspection */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inspeksi Visual
                    </label>
                    <div className="flex gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.visual_inspection === 'passed' 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                      }`}>
                        <input
                          type="radio"
                          checked={formData.visual_inspection === 'passed'}
                          onChange={() => setFormData(prev => ({ ...prev, visual_inspection: 'passed' }))}
                          className="sr-only"
                        />
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="font-medium">Baik</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.visual_inspection === 'failed' 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                      }`}>
                        <input
                          type="radio"
                          checked={formData.visual_inspection === 'failed'}
                          onChange={() => setFormData(prev => ({ ...prev, visual_inspection: 'failed' }))}
                          className="sr-only"
                        />
                        <XCircleIcon className="w-5 h-5" />
                        <span className="font-medium">Tidak Baik</span>
                      </label>
                    </div>
                  </div>

                  {/* Packaging Condition */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kondisi Kemasan
                    </label>
                    <select
                      value={formData.packaging_condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, packaging_condition: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="good">Baik - Tidak ada kerusakan</option>
                      <option value="acceptable">Dapat Diterima - Kerusakan minor</option>
                      <option value="damaged">Rusak - Tidak dapat diterima</option>
                    </select>
                  </div>

                  {/* Quantity Verified */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.quantity_verified}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_verified: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantity sesuai dengan PO
                      </span>
                    </label>
                  </div>

                  {/* Lab Test Required */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.lab_test_required}
                        onChange={(e) => setFormData(prev => ({ ...prev, lab_test_required: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Memerlukan pengujian lab
                      </span>
                    </label>
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
                      value={formData.sample_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, sample_size: parseInt(e.target.value) || 0 }))}
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
                      value={formData.defect_found}
                      onChange={(e) => setFormData(prev => ({ ...prev, defect_found: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan Inspeksi
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Catatan tambahan..."
                  />
                </div>

                {/* Final Result */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hasil Akhir Inspeksi
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: 'passed', label: 'LULUS', color: 'green', icon: CheckCircleIcon },
                      { value: 'conditional', label: 'BERSYARAT', color: 'yellow', icon: ExclamationTriangleIcon },
                      { value: 'rejected', label: 'DITOLAK', color: 'red', icon: XCircleIcon },
                    ].map(option => (
                      <label
                        key={option.value}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.result === option.value
                            ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20 text-${option.color}-700`
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Simpan Inspeksi
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
