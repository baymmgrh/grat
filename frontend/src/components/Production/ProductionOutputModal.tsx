import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, CubeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';

interface ProductionOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  days?: number;
  startDate?: string;
  endDate?: string;
}

interface MachineData {
  name: string;
  code: string;
  pack: number;
  carton: number;
}

interface ProductData {
  name: string;
  code: string;
  pack: number;
  carton: number;
  packs_per_karton: number;
}

interface DetailData {
  date: string;
  shift: string;
  machine_name: string;
  machine_code: string;
  product_name: string;
  product_code: string;
  pack_count: number;
  carton_count: number;
  packs_per_karton: number;
  reject_count: number;
  oee: number;
}

interface OutputData {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  summary: {
    total_pack: number;
    total_carton: number;
    total_records: number;
  };
  by_machine: MachineData[];
  by_product: ProductData[];
  by_shift: {
    shift_1: number;
    shift_2: number;
    shift_3: number;
  };
  details: DetailData[];
}

const ProductionOutputModal: React.FC<ProductionOutputModalProps> = ({
  isOpen,
  onClose,
  days = 30,
  startDate,
  endDate
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OutputData | null>(null);
  const [activeTab, setActiveTab] = useState<'machine' | 'product' | 'detail'>('machine');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, days, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { days };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axiosInstance.get('/api/executive/production-output-details', { params });
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to load data');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load production output details');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      'shift_1': 'Shift 1 (06:00-14:00)',
      'shift_2': 'Shift 2 (14:00-22:00)',
      'shift_3': 'Shift 3 (22:00-06:00)'
    };
    return labels[shift] || shift;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-lg font-semibold text-white">Detail Production Output</h3>
                {data && (
                  <p className="text-sm text-purple-200">
                    {data.period.start_date} s/d {data.period.end_date}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Cards */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Total Pack</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(data.summary.total_pack)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Total Karton</p>
                <p className="text-2xl font-bold text-indigo-600">{formatNumber(Math.round(data.summary.total_carton))}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Total Mesin</p>
                <p className="text-2xl font-bold text-blue-600">{data.by_machine.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Total Produk</p>
                <p className="text-2xl font-bold text-green-600">{data.by_product.length}</p>
              </div>
            </div>
          )}

          {/* Shift Summary */}
          {data && (
            <div className="px-4 pb-2">
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Shift 1: {formatNumber(data.by_shift.shift_1)} pack
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  Shift 2: {formatNumber(data.by_shift.shift_2)} pack
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                  Shift 3: {formatNumber(data.by_shift.shift_3)} pack
                </span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b px-4">
            <button
              onClick={() => setActiveTab('machine')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'machine'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <WrenchScrewdriverIcon className="w-4 h-4 inline mr-2" />
              Per Mesin
            </button>
            <button
              onClick={() => setActiveTab('product')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'product'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CubeIcon className="w-4 h-4 inline mr-2" />
              Per Produk
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'detail'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              Detail Shift
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : data ? (
              <>
                {/* Machine Tab */}
                {activeTab === 'machine' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesin</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pack</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Karton</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.by_machine.map((machine, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{machine.name}</div>
                            <div className="text-sm text-gray-500">{machine.code}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatNumber(machine.pack)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatNumber(Math.round(machine.carton))}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                              {((machine.pack / data.summary.total_pack) * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Product Tab */}
                {activeTab === 'product' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pack</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Karton</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pack/Ktn</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.by_product.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.code}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatNumber(product.pack)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatNumber(Math.round(product.carton))}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{product.packs_per_karton}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              {((product.pack / data.summary.total_pack) * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Detail Tab */}
                {activeTab === 'detail' && (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mesin</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pack</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Karton</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">OEE</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.details.slice(0, 100).map((detail, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">{detail.date}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              detail.shift === 'shift_1' ? 'bg-blue-100 text-blue-800' :
                              detail.shift === 'shift_2' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {detail.shift.replace('shift_', 'S')}
                            </span>
                          </td>
                          <td className="px-3 py-2">{detail.machine_name}</td>
                          <td className="px-3 py-2">
                            <div className="truncate max-w-[150px]" title={detail.product_name}>
                              {detail.product_name}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{formatNumber(detail.pack_count)}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{formatNumber(Math.round(detail.carton_count))}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              detail.oee >= 85 ? 'bg-green-100 text-green-800' :
                              detail.oee >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {detail.oee}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionOutputModal;
