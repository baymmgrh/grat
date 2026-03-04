import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock';
  severity: string;
  item_type: string;
  item_id: number;
  item_code: string;
  item_name: string;
  material_type?: string;
  category?: string;
  uom: string;
  current_stock: number;
  min_stock_level: number;
  shortage: number;
  title: string;
  message: string;
}

interface AlertSummary {
  out_of_stock: number;
  low_stock: number;
}

const StockAlerts: React.FC = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({ out_of_stock: 0, low_stock: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterItemType, setFilterItemType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [filterItemType]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = filterItemType ? `?item_type=${filterItemType}` : '';
      const res = await axiosInstance.get(`/api/warehouse/alerts${params}`);
      setAlerts(res.data.alerts || []);
      setSummary(res.data.summary || { out_of_stock: 0, low_stock: 0 });
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = alerts.filter(a => {
    const matchType = !filterType || a.type === filterType;
    const matchSearch = !searchTerm ||
      a.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ExclamationTriangleIcon className="h-7 w-7 text-amber-500" />
          Stok Minimum Alert
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Barang yang stoknya di bawah batas minimum
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Alert</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{alerts.length}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div className="text-sm text-red-600 dark:text-red-400">Habis (Out of Stock)</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{summary.out_of_stock}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="text-sm text-amber-600 dark:text-amber-400">Stok Rendah (Low Stock)</div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{summary.low_stock}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode/nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterItemType}
          onChange={(e) => setFilterItemType(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Semua Jenis</option>
          <option value="product">Produk</option>
          <option value="material">Material</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Semua Status</option>
          <option value="out_of_stock">Habis</option>
          <option value="low_stock">Stok Rendah</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Jenis</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Kode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nama Barang</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Stok Saat Ini</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Minimum</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Kekurangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="px-4 py-3">
                  {alert.type === 'out_of_stock' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <ExclamationCircleIcon className="h-3.5 w-3.5" />
                      Habis
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                      Rendah
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    alert.item_type === 'product'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {alert.item_type === 'product' ? 'Produk' : 'Material'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white">{alert.item_code}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{alert.item_name}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  <span className={alert.current_stock <= 0 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                    {alert.current_stock.toLocaleString()}
                  </span>
                  <span className="text-gray-400 ml-1">{alert.uom}</span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-gray-600 dark:text-gray-400">
                  {alert.min_stock_level.toLocaleString()} {alert.uom}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-red-600 font-bold">
                  -{alert.shortage.toLocaleString()} {alert.uom}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="text-gray-400 dark:text-gray-500">
                    <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Tidak ada alert stok minimum</p>
                    <p className="text-xs mt-1">Semua barang dalam kondisi stok aman</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockAlerts;
