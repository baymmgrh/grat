import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CubeIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

interface WorkOrderData {
  id: number;
  wo_number: string;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  quantity_produced: number;
  quantity_good: number;
  quantity_scrap: number;
  uom: string;
  batch_number: string | null;
  machine_name: string | null;
  completed_date: string | null;
  pack_per_carton: number;
}

interface QCFormData {
  result: 'pending' | 'passed' | 'failed' | 'conditional';
  defects_found: string;
  notes: string;
  visual_inspection: 'passed' | 'failed';
  dimension_check: 'passed' | 'failed' | 'na';
  weight_check: 'passed' | 'failed' | 'na';
  packaging_check: 'passed' | 'failed' | 'na';
  label_check: 'passed' | 'failed' | 'na';
  sample_qty: number;
  defect_qty: number;
}

interface RejectInspectionEntry {
  id: number;
  category: string;
  quantity: number;
  reason: string;
}

const REJECT_CATEGORIES = [
  { value: 'sobek', label: 'Sobek / Robek' },
  { value: 'kotor', label: 'Kotor / Noda' },
  { value: 'basah', label: 'Basah / Lembab' },
  { value: 'lipatan', label: 'Lipatan Tidak Rapi' },
  { value: 'dimensi', label: 'Dimensi Tidak Sesuai' },
  { value: 'warna', label: 'Warna Tidak Sesuai' },
  { value: 'bau', label: 'Bau Tidak Normal' },
  { value: 'kemasan', label: 'Kemasan Rusak' },
  { value: 'label', label: 'Label Salah / Rusak' },
  { value: 'kontaminasi', label: 'Kontaminasi' },
  { value: 'ter_seal', label: 'Product Ter-seal' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function WorkOrderQCForm() {
  const navigate = useNavigate();
  const { woId } = useParams();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get('testId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrderData | null>(null);
  const [existingTest, setExistingTest] = useState<any>(null);
  const [rejectEntries, setRejectEntries] = useState<RejectInspectionEntry[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<QCFormData>({
    defaultValues: {
      result: 'pending',
      defects_found: '',
      notes: '',
      visual_inspection: 'passed',
      dimension_check: 'na',
      weight_check: 'na',
      packaging_check: 'passed',
      label_check: 'passed',
      sample_qty: 10,
      defect_qty: 0,
    }
  });

  const watchedValues = watch();

  // Auto-calculate result based on checks
  useEffect(() => {
    const checks = [
      watchedValues.visual_inspection,
      watchedValues.dimension_check,
      watchedValues.weight_check,
      watchedValues.packaging_check,
      watchedValues.label_check,
    ];
    
    const failedCount = checks.filter(c => c === 'failed').length;
    const passedCount = checks.filter(c => c === 'passed').length;
    
    if (failedCount > 0) {
      setValue('result', 'failed');
    } else if (watchedValues.defect_qty > 0) {
      setValue('result', 'conditional');
    } else if (passedCount > 0) {
      setValue('result', 'passed');
    }
  }, [
    watchedValues.visual_inspection,
    watchedValues.dimension_check,
    watchedValues.weight_check,
    watchedValues.packaging_check,
    watchedValues.label_check,
    watchedValues.defect_qty,
    setValue
  ]);

  useEffect(() => {
    fetchWorkOrderData();
  }, [woId]);

  const fetchWorkOrderData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending QC data to get work order info
      const response = await fetch(`http://${window.location.hostname}:5000/api/quality/pending-qc`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      const allWorkOrders = [...(data.pending_qc || []), ...(data.completed_qc || [])];
      const wo = allWorkOrders.find((w: any) => w.id === parseInt(woId || '0'));
      
      if (wo) {
        setWorkOrder(wo);
        
        // If there's an existing test, fetch its details
        if (wo.qc_test_id) {
          const testResponse = await fetch(`http://${window.location.hostname}:5000/api/quality/work-order/${woId}/qc-test`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            setExistingTest(testData.test);
            
            // Pre-fill form with existing data
            if (testData.test.result) {
              setValue('result', testData.test.result);
            }
            if (testData.test.notes) {
              setValue('notes', testData.test.notes);
            }
            if (testData.test.defects_found) {
              setValue('defects_found', testData.test.defects_found);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching work order:', error);
      toast.error('Gagal memuat data Work Order');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: QCFormData) => {
    if (!workOrder) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build notes with all check results
      const checkResults = [
        `Visual Inspection: ${formData.visual_inspection.toUpperCase()}`,
        formData.dimension_check !== 'na' ? `Dimension Check: ${formData.dimension_check.toUpperCase()}` : null,
        formData.weight_check !== 'na' ? `Weight Check: ${formData.weight_check.toUpperCase()}` : null,
        `Packaging Check: ${formData.packaging_check.toUpperCase()}`,
        `Label Check: ${formData.label_check.toUpperCase()}`,
        `Sample Qty: ${formData.sample_qty}`,
        `Defect Qty: ${formData.defect_qty}`,
      ].filter(Boolean).join('\n');
      
      // Build reject inspection summary
      let rejectSummary = '';
      if (rejectEntries.length > 0) {
        const rejectLines = rejectEntries.map((entry, idx) => {
          const catLabel = REJECT_CATEGORIES.find(c => c.value === entry.category)?.label || entry.category;
          return `  ${idx + 1}. ${catLabel}: ${entry.quantity} ${workOrder.uom} - ${entry.reason || 'Tidak ada keterangan'}`;
        });
        rejectSummary = `\n\n=== INSPEKSI REJECT (${totalInspectedRejects}/${workOrder.quantity_scrap}) ===\n${rejectLines.join('\n')}`;
      }
      
      const fullNotes = `${checkResults}${rejectSummary}\n\n${formData.notes || ''}`.trim();
      
      if (existingTest) {
        // Update existing test
        const response = await fetch(`http://${window.location.hostname}:5000/api/quality/tests/${existingTest.id}/result`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            result: formData.result,
            defects_found: formData.defects_found,
            notes: fullNotes,
          }),
        });
        
        if (!response.ok) throw new Error('Failed to update QC test');
        
        toast.success('QC Test berhasil diupdate!');
      } else {
        // Create new test
        const response = await fetch(`http://${window.location.hostname}:5000/api/quality/work-order/${workOrder.id}/qc-test`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            result: formData.result,
            notes: fullNotes,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create QC test');
        }
        
        toast.success('QC Test berhasil dibuat!');
      }
      
      navigate('/app/quality/pending-qc');
    } catch (error: any) {
      console.error('Error submitting QC:', error);
      toast.error(error.message || 'Gagal menyimpan QC Test');
    } finally {
      setSubmitting(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircleIcon className="w-4 h-4" />
            PASSED
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircleIcon className="w-4 h-4" />
            FAILED
          </span>
        );
      case 'conditional':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ExclamationTriangleIcon className="w-4 h-4" />
            CONDITIONAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            PENDING
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Reject inspection functions
  const addRejectEntry = () => {
    setRejectEntries(prev => [...prev, {
      id: Date.now(),
      category: '',
      quantity: 0,
      reason: ''
    }]);
  };

  const updateRejectEntry = (id: number, field: keyof RejectInspectionEntry, value: string | number) => {
    setRejectEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const removeRejectEntry = (id: number) => {
    setRejectEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const totalInspectedRejects = rejectEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
  const remainingRejects = (workOrder?.quantity_scrap || 0) - totalInspectedRejects;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Work Order tidak ditemukan</p>
        <button
          onClick={() => navigate('/app/quality/pending-qc')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Kembali ke daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/quality/pending-qc')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-7 h-7 text-blue-600" />
              QC Inspection
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {existingTest ? 'Update hasil QC' : 'Input hasil Quality Control'}
            </p>
          </div>
        </div>
        <div>
          {getResultBadge(watchedValues.result)}
        </div>
      </div>

      {/* Work Order Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Informasi Work Order
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">WO Number</p>
            <p className="font-semibold text-gray-900 dark:text-white">{workOrder.wo_number}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Batch Number</p>
            <p className="font-semibold text-gray-900 dark:text-white">{workOrder.batch_number || '-'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mesin</p>
            <p className="font-semibold text-gray-900 dark:text-white">{workOrder.machine_name || '-'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tanggal Selesai</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(workOrder.completed_date)}</p>
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CubeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Produk</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{workOrder.product_code}</p>
              <p className="text-gray-600 dark:text-gray-300">{workOrder.product_name}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {workOrder.quantity_produced.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Produksi ({workOrder.uom})</p>
              {workOrder.pack_per_carton > 0 && (
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  = {(workOrder.quantity_produced / workOrder.pack_per_carton).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Karton
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {workOrder.quantity_good.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Good ({workOrder.uom})</p>
              {workOrder.pack_per_carton > 0 && (
                <p className="text-xs text-green-500 dark:text-green-400">
                  = {(workOrder.quantity_good / workOrder.pack_per_carton).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Karton
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {workOrder.quantity_scrap.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scrap ({workOrder.uom})</p>
              {workOrder.pack_per_carton > 0 && workOrder.quantity_scrap > 0 && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  = {(workOrder.quantity_scrap / workOrder.pack_per_carton).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Karton
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {workOrder.pack_per_carton || '-'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pack/Karton</p>
            </div>
          </div>
        </div>
      </div>

      {/* QC Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Quick Checks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BeakerIcon className="w-5 h-5 text-blue-600" />
            Checklist Inspeksi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual Inspection */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visual Inspection *
              </label>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.visual_inspection === 'passed' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    value="passed"
                    {...register('visual_inspection')}
                    className="sr-only"
                  />
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Pass</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.visual_inspection === 'failed' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    value="failed"
                    {...register('visual_inspection')}
                    className="sr-only"
                  />
                  <XCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Fail</span>
                </label>
              </div>
            </div>

            {/* Packaging Check */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Packaging Check *
              </label>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.packaging_check === 'passed' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    value="passed"
                    {...register('packaging_check')}
                    className="sr-only"
                  />
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Pass</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.packaging_check === 'failed' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    value="failed"
                    {...register('packaging_check')}
                    className="sr-only"
                  />
                  <XCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Fail</span>
                </label>
              </div>
            </div>

            {/* Label Check */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Label Check *
              </label>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.label_check === 'passed' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    value="passed"
                    {...register('label_check')}
                    className="sr-only"
                  />
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Pass</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.label_check === 'failed' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    value="failed"
                    {...register('label_check')}
                    className="sr-only"
                  />
                  <XCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Fail</span>
                </label>
              </div>
            </div>

            {/* Dimension Check */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dimension Check
              </label>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                  watchedValues.dimension_check === 'passed' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}>
                  <input type="radio" value="passed" {...register('dimension_check')} className="sr-only" />
                  Pass
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                  watchedValues.dimension_check === 'failed' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
                }`}>
                  <input type="radio" value="failed" {...register('dimension_check')} className="sr-only" />
                  Fail
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                  watchedValues.dimension_check === 'na' 
                    ? 'border-gray-500 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}>
                  <input type="radio" value="na" {...register('dimension_check')} className="sr-only" />
                  N/A
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sample & Defect */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sampling & Defect
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah Sample
              </label>
              <input
                type="number"
                min="1"
                {...register('sample_qty', { required: true, min: 1 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah Defect Ditemukan
              </label>
              <input
                type="number"
                min="0"
                {...register('defect_qty', { min: 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reject Inspection Section - Only show if there are rejects */}
        {workOrder.quantity_scrap > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                  <XCircleIcon className="w-5 h-5" />
                  Inspeksi Reject / Scrap
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Total reject dari produksi: <span className="font-bold">{workOrder.quantity_scrap.toLocaleString()}</span> {workOrder.uom}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Sudah diinspeksi</p>
                <p className={`text-xl font-bold ${totalInspectedRejects === workOrder.quantity_scrap ? 'text-green-600' : 'text-orange-600'}`}>
                  {totalInspectedRejects} / {workOrder.quantity_scrap}
                </p>
                {remainingRejects > 0 && (
                  <p className="text-xs text-orange-600">Sisa: {remainingRejects}</p>
                )}
                {remainingRejects < 0 && (
                  <p className="text-xs text-red-600">Melebihi: {Math.abs(remainingRejects)}</p>
                )}
              </div>
            </div>

            {/* Reject Entries */}
            <div className="space-y-3">
              {rejectEntries.map((entry, index) => (
                <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Kategori Reject
                        </label>
                        <select
                          value={entry.category}
                          onChange={(e) => updateRejectEntry(entry.id, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Pilih kategori...</option>
                          {REJECT_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Jumlah ({workOrder.uom})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={workOrder.quantity_scrap}
                          value={entry.quantity || ''}
                          onChange={(e) => updateRejectEntry(entry.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Alasan / Keterangan
                        </label>
                        <input
                          type="text"
                          value={entry.reason}
                          onChange={(e) => updateRejectEntry(entry.id, 'reason', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500"
                          placeholder="Jelaskan alasan reject..."
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRejectEntry(entry.id)}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Entry Button */}
              <button
                type="button"
                onClick={addRejectEntry}
                disabled={totalInspectedRejects >= workOrder.quantity_scrap}
                className="w-full py-3 border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                Tambah Kategori Reject
              </button>

              {/* Validation Message */}
              {rejectEntries.length > 0 && totalInspectedRejects !== workOrder.quantity_scrap && (
                <div className={`p-3 rounded-lg text-sm ${remainingRejects > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {remainingRejects > 0 
                    ? `⚠️ Masih ada ${remainingRejects} reject yang belum dikategorikan`
                    : `❌ Total kategori melebihi jumlah reject (${Math.abs(remainingRejects)} lebih)`
                  }
                </div>
              )}

              {totalInspectedRejects === workOrder.quantity_scrap && rejectEntries.length > 0 && (
                <div className="p-3 rounded-lg text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✅ Semua reject sudah dikategorikan dengan benar
                </div>
              )}
            </div>
          </div>
        )}

        {/* Defects & Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Catatan & Temuan
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Defect yang Ditemukan
              </label>
              <textarea
                {...register('defects_found')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Jelaskan defect yang ditemukan (jika ada)..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catatan Tambahan
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan tambahan untuk QC ini..."
              />
            </div>
          </div>
        </div>

        {/* Result Override */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hasil Akhir QC
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {['passed', 'conditional', 'failed'].map((result) => (
              <label
                key={result}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                  watchedValues.result === result
                    ? result === 'passed'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : result === 'failed'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  value={result}
                  {...register('result')}
                  className="sr-only"
                />
                {result === 'passed' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                {result === 'failed' && <XCircleIcon className="w-5 h-5 text-red-600" />}
                {result === 'conditional' && <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />}
                <span className="font-medium capitalize">{result}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/quality/pending-qc')}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                {existingTest ? 'Update QC' : 'Simpan QC'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
