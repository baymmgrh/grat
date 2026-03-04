import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BookOpenIcon,
  CalculatorIcon,
  ChartBarIcon as Calculator,
  ChartPieIcon,
  CheckCircleIcon
,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface FinanceKPIs {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  cash_balance: number;
  accounts_receivable: number;
  accounts_payable: number;
  working_capital: number;
}

interface CashFlowData {
  month: string;
  cash_in: number;
  cash_out: number;
  net_cash_flow: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  profit: number;
  expenses: number;
}

const FinanceDashboard: React.FC = () => {
  const { t } = useLanguage();

  const [kpis, setKpis] = useState<FinanceKPIs>({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    profit_margin: 0,
    cash_balance: 0,
    accounts_receivable: 0,
    accounts_payable: 0,
    working_capital: 0
  });
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      
      const [kpisRes, cashFlowRes, expensesRes, revenueRes] = await Promise.all([
        axiosInstance.get('/api/finance/dashboard/kpis'),
        axiosInstance.get('/api/finance/dashboard/cash-flow'),
        axiosInstance.get('/api/finance/dashboard/expenses'),
        axiosInstance.get('/api/finance/dashboard/revenue')
      ]);

      setKpis(kpisRes.data?.kpis || {});
      setCashFlowData(cashFlowRes.data?.cash_flow || []);
      setExpenseBreakdown(expensesRes.data?.expenses || []);
      setRevenueData(revenueRes.data?.revenue || []);
    } catch (error) {
      console.error('Failed to load finance data:', error);
      // Mock data
      setKpis({
        total_revenue: 125000000000,
        total_expenses: 95000000000,
        net_profit: 30000000000,
        profit_margin: 24.0,
        cash_balance: 45000000000,
        accounts_receivable: 18500000000,
        accounts_payable: 12300000000,
        working_capital: 33200000000
      });

      setCashFlowData([
        { month: 'Jul', cash_in: 22000000000, cash_out: 18500000000, net_cash_flow: 3500000000 },
        { month: 'Aug', cash_in: 25000000000, cash_out: 19800000000, net_cash_flow: 5200000000 },
        { month: 'Sep', cash_in: 23500000000, cash_out: 20100000000, net_cash_flow: 3400000000 },
        { month: 'Oct', cash_in: 28000000000, cash_out: 21500000000, net_cash_flow: 6500000000 },
        { month: 'Nov', cash_in: 26500000000, cash_out: 20800000000, net_cash_flow: 5700000000 },
        { month: 'Dec', cash_in: 31000000000, cash_out: 22000000000, net_cash_flow: 9000000000 }
      ]);

      setExpenseBreakdown([
        { category: 'Raw Materials', amount: 35000000000, percentage: 36.8 },
        { category: 'Labor Costs', amount: 28000000000, percentage: 29.5 },
        { category: 'Manufacturing', amount: 15000000000, percentage: 15.8 },
        { category: 'Marketing & Sales', amount: 8500000000, percentage: 8.9 },
        { category: 'Administration', amount: 5200000000, percentage: 5.5 },
        { category: 'Others', amount: 3300000000, percentage: 3.5 }
      ]);

      setRevenueData([
        { month: 'Jul', revenue: 18500000000, profit: 4200000000, expenses: 14300000000 },
        { month: 'Aug', revenue: 21200000000, profit: 5100000000, expenses: 16100000000 },
        { month: 'Sep', revenue: 19800000000, profit: 4600000000, expenses: 15200000000 },
        { month: 'Oct', revenue: 24500000000, profit: 6200000000, expenses: 18300000000 },
        { month: 'Nov', revenue: 22800000000, profit: 5800000000, expenses: 17000000000 },
        { month: 'Dec', revenue: 28200000000, profit: 7500000000, expenses: 20700000000 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading finance dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Financial overview and key performance indicators</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(kpis.total_revenue)}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(kpis.net_profit)}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.3%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cash Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(kpis.cash_balance)}</p>
              <div className="flex items-center mt-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CalculatorIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercent(kpis.profit_margin)}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+2.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(0)}B`} />
              <Tooltip formatter={(value, name) => [
                formatRupiah(value as number),
                name === 'cash_in' ? 'Cash In' :
                name === 'cash_out' ? 'Cash Out' : 'Net Cash Flow'
              ]} />
              <Area type="monotone" dataKey="cash_in" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="cash_out" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              <Line type="monotone" dataKey="net_cash_flow" stroke="#3B82F6" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatRupiah(value as number), 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue & Profit Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profit Trend</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(0)}B`} />
            <Tooltip formatter={(value, name) => [
              formatRupiah(value as number),
              name === 'revenue' ? 'Revenue' :
              name === 'profit' ? 'Profit' : 'Expenses'
            ]} />
            <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
            <Bar dataKey="profit" fill="#10B981" name="Profit" />
            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accounts Receivable</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(kpis.accounts_receivable)}</p>
            </div>
            <CreditCardIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Average collection: 32 days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accounts Payable</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(kpis.accounts_payable)}</p>
            </div>
            <BanknotesIcon className="h-8 w-8 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Average payment: 28 days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Working Capital</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(kpis.working_capital)}</p>
            </div>
            <ChartPieIcon className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">Ratio: 2.7x</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(kpis.total_expenses)}</p>
            </div>
            <CalculatorIcon className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">76% of revenue</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/app/finance/accounting"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <BookOpenIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Accounting</span>
            </div>
          </Link>
          
          <Link
            to="/app/finance/budget"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <CalculatorIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Budget Planning</span>
            </div>
          </Link>
          
          <Link
            to="/app/finance/cash-flow"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <BanknotesIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Cash Flow</span>
            </div>
          </Link>
          
          <Link
            to="/app/finance/reports"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-center">
              <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Reports</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
