import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon

} from '@heroicons/react/24/outline';
interface CashFlowForecast {
  period: string;
  opening_balance: number;
  cash_in: number;
  cash_out: number;
  closing_balance: number;
}

interface CashFlowAnalysis {
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
  cash_conversion_cycle: number;
  free_cash_flow: number;
}

const CashFlowManagement: React.FC = () => {
  const { t } = useLanguage();

  const [forecast, setForecast] = useState<CashFlowForecast[]>([]);
  const [analysis, setAnalysis] = useState<CashFlowAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadCashFlowData();
  }, [selectedPeriod]);

  const loadCashFlowData = async () => {
    try {
      setLoading(true);
      
      const [forecastRes, analysisRes] = await Promise.all([
        axiosInstance.get('/api/finance/cash-flow/forecast'),
        axiosInstance.get('/api/finance/cash-flow/analysis')
      ]);

      setForecast(forecastRes.data?.forecast || []);
      setAnalysis(analysisRes.data?.analysis || null);
    } catch (error) {
      console.error('Failed to load cash flow data:', error);
      // Mock data fallback
      if (selectedPeriod === 'weekly') {
        setForecast([
          { period: 'Week 1', opening_balance: 45000000000, cash_in: 8500000000, cash_out: 7200000000, closing_balance: 46300000000 },
          { period: 'Week 2', opening_balance: 46300000000, cash_in: 9200000000, cash_out: 8100000000, closing_balance: 47400000000 },
          { period: 'Week 3', opening_balance: 47400000000, cash_in: 8800000000, cash_out: 7800000000, closing_balance: 48400000000 },
          { period: 'Week 4', opening_balance: 48400000000, cash_in: 10500000000, cash_out: 9200000000, closing_balance: 49700000000 }
        ]);
      } else {
        setForecast([
          { period: 'Jan', opening_balance: 42000000000, cash_in: 25000000000, cash_out: 22000000000, closing_balance: 45000000000 },
          { period: 'Feb', opening_balance: 45000000000, cash_in: 28000000000, cash_out: 24500000000, closing_balance: 48500000000 },
          { period: 'Mar', opening_balance: 48500000000, cash_in: 26500000000, cash_out: 23800000000, closing_balance: 51200000000 },
          { period: 'Apr', opening_balance: 51200000000, cash_in: 29500000000, cash_out: 26200000000, closing_balance: 54500000000 },
          { period: 'May', opening_balance: 54500000000, cash_in: 31000000000, cash_out: 28500000000, closing_balance: 57000000000 },
          { period: 'Jun', opening_balance: 57000000000, cash_in: 33500000000, cash_out: 30200000000, closing_balance: 60300000000 }
        ]);
      }

      setAnalysis({
        operating_cash_flow: 35000000000,
        investing_cash_flow: -8500000000,
        financing_cash_flow: -2500000000,
        net_cash_flow: 24000000000,
        cash_conversion_cycle: 45,
        free_cash_flow: 26500000000
      });
    } finally {
      setLoading(false);
    }
  };

  const formatShortCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000000000) {
      return `${(amount / 1000000000000).toFixed(1)}T`;
    } else if (Math.abs(amount) >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(amount) >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return formatRupiah(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading cash flow data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cash Flow Management</h1>
          <p className="text-gray-600 mt-1">Cash flow tracking and forecasting</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'weekly' | 'monthly')}
          >
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </select>
          <button className="btn-secondary">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Cash Flow Analysis Cards */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Operating CF</p>
                <p className="text-lg font-bold text-gray-900">{formatShortCurrency(analysis.operating_cash_flow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg">
                <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Investing CF</p>
                <p className="text-lg font-bold text-gray-900">{formatShortCurrency(analysis.investing_cash_flow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BanknotesIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Financing CF</p>
                <p className="text-lg font-bold text-gray-900">{formatShortCurrency(analysis.financing_cash_flow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Net Cash Flow</p>
                <p className="text-lg font-bold text-gray-900">{formatShortCurrency(analysis.net_cash_flow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-orange-100 p-2 rounded-lg">
                <ClockIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Cash Cycle</p>
                <p className="text-lg font-bold text-gray-900">{analysis.cash_conversion_cycle} days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Free Cash Flow</p>
                <p className="text-lg font-bold text-gray-900">{formatShortCurrency(analysis.free_cash_flow)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Forecast Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Forecast</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => formatShortCurrency(value)} />
            <Tooltip formatter={(value, name) => [
              formatRupiah(value as number),
              name === 'cash_in' ? 'Cash In' :
              name === 'cash_out' ? 'Cash Out' :
              name === 'closing_balance' ? 'Closing Balance' : 'Opening Balance'
            ]} />
            <Area type="monotone" dataKey="cash_in" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            <Area type="monotone" dataKey="cash_out" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            <Line type="monotone" dataKey="closing_balance" stroke="#3B82F6" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cash Flow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash In vs Cash Out */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash In vs Cash Out</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => formatShortCurrency(value)} />
              <Tooltip formatter={(value, name) => [
                formatRupiah(value as number),
                name === 'cash_in' ? 'Cash In' : 'Cash Out'
              ]} />
              <Bar dataKey="cash_in" fill="#10B981" name="Cash In" />
              <Bar dataKey="cash_out" fill="#EF4444" name="Cash Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Balance Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Balance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => formatShortCurrency(value)} />
              <Tooltip formatter={(value, name) => [
                formatRupiah(value as number),
                name === 'opening_balance' ? 'Opening Balance' : 'Closing Balance'
              ]} />
              <Line type="monotone" dataKey="opening_balance" stroke="#8B5CF6" strokeWidth={2} name="Opening Balance" />
              <Line type="monotone" dataKey="closing_balance" stroke="#3B82F6" strokeWidth={3} name="Closing Balance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Forecast Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Cash Flow Forecast</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cash In
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cash Out
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Flow
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecast.map((item, index) => {
                const netFlow = item.cash_in - item.cash_out;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatRupiah(item.opening_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                      {formatRupiah(item.cash_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                      {formatRupiah(item.cash_out)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatRupiah(netFlow)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                      {formatRupiah(item.closing_balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cash In</p>
              <p className="text-xl font-bold text-green-600">
                {formatRupiah(forecast.reduce((sum, f) => sum + f.cash_in, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cash Out</p>
              <p className="text-xl font-bold text-red-600">
                {formatRupiah(forecast.reduce((sum, f) => sum + f.cash_out, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
              <p className="text-xl font-bold text-blue-600">
                {formatRupiah(forecast.reduce((sum, f) => sum + (f.cash_in - f.cash_out), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ending Balance</p>
              <p className="text-xl font-bold text-gray-900">
                {forecast.length > 0 ? formatRupiah(forecast[forecast.length - 1].closing_balance) : formatRupiah(0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowManagement;
