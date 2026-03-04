import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CubeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';

interface MaterialItem {
  type: 'material' | 'product';
  id: number;
  name: string;
  required: number;
  available: number;
  sufficient: boolean;
  shortage: number;
}

interface MaterialAvailability {
  available: boolean;
  message: string;
  items: MaterialItem[];
  total_items: number;
  insufficient_count: number;
}

interface Props {
  workOrderId: number;
  onAvailabilityChange?: (available: boolean) => void;
}

const MaterialAvailabilityCheck: React.FC<Props> = ({ workOrderId, onAvailabilityChange }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MaterialAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/production/work-orders/${workOrderId}/material-availability`);
      setData(res.data);
      if (onAvailabilityChange) {
        onAvailabilityChange(res.data.available);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check material availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [workOrderId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5 text-slate-400 animate-spin" />
          <span className="text-sm text-slate-600">Checking material availability...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`rounded-lg border ${data.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {data.available ? (
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          ) : (
            <div className="p-2 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div>
            <h3 className={`font-semibold ${data.available ? 'text-green-800' : 'text-red-800'}`}>
              Material Availability
            </h3>
            <p className={`text-sm ${data.available ? 'text-green-600' : 'text-red-600'}`}>
              {data.message}
            </p>
          </div>
        </div>
        <button
          onClick={fetchAvailability}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Summary */}
      {!data.available && (
        <div className="bg-red-100 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-red-800">
            ⚠️ {data.insufficient_count} of {data.total_items} materials are insufficient
          </p>
        </div>
      )}

      {/* Material List */}
      <div className="space-y-2">
        {data.items.map((item, index) => (
          <div
            key={`${item.type}-${item.id}`}
            className={`flex items-center justify-between p-3 rounded-lg ${
              item.sufficient ? 'bg-white border border-slate-200' : 'bg-red-100 border border-red-300'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <CubeIcon className={`h-5 w-5 ${item.sufficient ? 'text-slate-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className={`font-medium ${item.sufficient ? 'text-slate-800' : 'text-red-800'}`}>
                  {item.name}
                </p>
                <p className="text-xs text-slate-500">
                  {item.type === 'material' ? 'Raw Material' : 'Component'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  Required: <span className="text-blue-600">{item.required.toLocaleString()}</span>
                </p>
                <p className={`text-sm ${item.sufficient ? 'text-green-600' : 'text-red-600'}`}>
                  Available: <span className="font-medium">{item.available.toLocaleString()}</span>
                </p>
              </div>

              {item.sufficient ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <div className="text-right">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                  <p className="text-xs text-red-600 font-medium mt-1">
                    Short: {item.shortage.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Hint */}
      {!data.available && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> You cannot start production until all materials are available. 
            Please check with warehouse or create a purchase requisition for shortage items.
          </p>
        </div>
      )}
    </div>
  );
};

export default MaterialAvailabilityCheck;
