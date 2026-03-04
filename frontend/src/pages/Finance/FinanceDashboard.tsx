import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BookOpenIcon,
  CalculatorIcon,
  ChartBarIcon,
  ChartBarIcon as Calculator,
  ChartPieIcon,
  CheckCircleIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
      // Set minimal fallback data to prevent chart errors
      setKpis({
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        profit_margin: 0,
        cash_balance: 0,
        accounts_receivable: 0,
        accounts_payable: 0,
        working_capital: 0
      });
      setCashFlowData([
        { month: 'Jan', cash_in: 0, cash_out: 0, net_cash_flow: 0 },
        { month: 'Feb', cash_in: 0, cash_out: 0, net_cash_flow: 0 },
        { month: 'Mar', cash_in: 0, cash_out: 0, net_cash_flow: 0 }
      ]);
      setExpenseBreakdown([
        { category: 'No Data', amount: 1, percentage: 100 }
      ]);
      setRevenueData([
        { month: 'Jan', revenue: 0, profit: 0, expenses: 0 },
        { month: 'Feb', revenue: 0, profit: 0, expenses: 0 },
        { month: 'Mar', revenue: 0, profit: 0, expenses: 0 }
      ]);
    } finally {
      setLoading(false);
    }
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
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
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
              <Area type="monotone" dataKey="net_cash_flow" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
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
                {expenseBreakdown.map((_, index) => (
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
