import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import MaterialAvailabilityCheck from './MaterialAvailabilityCheck';

interface Props {
  workOrderId: number;
  woNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StartProductionDialog: React.FC<Props> = ({ 
  workOrderId, 
  woNumber, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialAvailable, setMaterialAvailable] = useState(false);
  const [autoDeduct, setAutoDeduct] = useState(true);

  const handleStartProduction = async () => {
    if (!materialAvailable && autoDeduct) {
      setError('Cannot start production: Materials are not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axiosInstance.put(`/api/production/work-orders/${workOrderId}/status`, {
        status: 'in_progress',
        auto_deduct: autoDeduct
      });

      if (res.data.integration_results?.material_deduction) {
        const deduction = res.data.integration_results.material_deduction;
        if (!deduction.success) {
          setError(deduction.message);
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.details?.message || 'Failed to start production';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <PlayIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Start Production</h2>
              <p className="text-sm text-slate-500">WO: {woNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Material Availability Check */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Material Availability</h3>
            <MaterialAvailabilityCheck
              workOrderId={workOrderId}
              onAvailabilityChange={setMaterialAvailable}
            />
          </div>

          {/* Auto-Deduct Option */}
          <div className="bg-slate-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDeduct}
                onChange={(e) => setAutoDeduct(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-800">Auto-deduct materials from warehouse</p>
                <p className="text-sm text-slate-600 mt-1">
                  When enabled, materials will be automatically deducted from inventory when production starts.
                  If disabled, you'll need to manually issue materials.
                </p>
              </div>
            </label>
          </div>

          {/* Warning */}
          {autoDeduct && !materialAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Cannot Start Production</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Some materials are insufficient. Please ensure all materials are available before starting production,
                    or disable auto-deduction to manually manage materials.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Info */}
          {materialAvailable && autoDeduct && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Ready to Start</p>
                  <p className="text-sm text-green-700 mt-1">
                    All materials are available. Materials will be automatically deducted from inventory when you start production.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleStartProduction}
            disabled={loading || (autoDeduct && !materialAvailable)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              loading || (autoDeduct && !materialAvailable)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                Start Production
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartProductionDialog;
