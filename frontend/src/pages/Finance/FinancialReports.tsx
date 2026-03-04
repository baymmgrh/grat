import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import { exportToCSV, generatePDFReport } from '../../utils/exportUtils'
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
interface IncomeStatement {
  revenue: {
    sales_revenue: number
    other_income: number
    total_revenue: number
  }
  cost_of_sales: {
    direct_materials: number
    direct_labor: number
    manufacturing_overhead: number
    total_cogs: number
  }
  gross_profit: number
  operating_expenses: {
    selling_expenses: number
    administrative_expenses: number
    total_operating_expenses: number
  }
  operating_income: number
  other_expenses: {
    interest_expense: number
    depreciation: number
    total_other_expenses: number
  }
  net_income_before_tax: number
  income_tax: number
  net_income: number
}

interface BalanceSheet {
  assets: {
    current_assets: {
      cash: number
      accounts_receivable: number
      inventory: number
      prepaid_expenses: number
      total_current_assets: number
    }
    fixed_assets: {
      property_plant_equipment: number
      accumulated_depreciation: number
      net_fixed_assets: number
    }
    total_assets: number
  }
  liabilities: {
    current_liabilities: {
      accounts_payable: number
      accrued_liabilities: number
      short_term_debt: number
      total_current_liabilities: number
    }
    long_term_liabilities: {
      long_term_debt: number
      total_long_term_liabilities: number
    }
    total_liabilities: number
  }
  equity: {
    common_stock: number
    retained_earnings: number
    total_equity: number
  }
  total_liabilities_equity: number
}

interface CashFlow {
  operating_activities: {
    net_income: number
    depreciation: number
    changes_in_working_capital: number
    net_cash_from_operations: number
  }
  investing_activities: {
    purchase_of_equipment: number
    sale_of_assets: number
    net_cash_from_investing: number
  }
  financing_activities: {
    loan_proceeds: number
    loan_repayments: number
    dividends_paid: number
    net_cash_from_financing: number
  }
  net_change_in_cash: number
  beginning_cash: number
  ending_cash: number
}

const FinancialReports = () => {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<'income' | 'balance' | 'cashflow'>('income')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadReports()
  }, [selectedYear])

  const loadReports = async () => {
    try {
      setLoading(true)
      const [incomeRes, balanceRes, cashFlowRes] = await Promise.all([
        axiosInstance.get(`/api/finance/reports/income-statement?year=${selectedYear}`),
        axiosInstance.get(`/api/finance/reports/balance-sheet`),
        axiosInstance.get(`/api/finance/reports/cash-flow?year=${selectedYear}`)
      ])

      setIncomeStatement(incomeRes.data.income_statement)
      setBalanceSheet(balanceRes.data.balance_sheet)
      setCashFlow(cashFlowRes.data.cash_flow)
    } catch (error) {
      console.error('Error loading financial reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Income Statement - {selectedYear}</h3>
          
          <div className="space-y-4">
            {/* Revenue Section */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-green-700 mb-2">REVENUE</h4>
              <div className="ml-4 space-y-1">
                <div className="flex justify-between">
                  <span>Sales Revenue</span>
                  <span>{formatRupiah(incomeStatement.revenue?.sales_revenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Income</span>
                  <span>{formatRupiah(incomeStatement.revenue?.other_income || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Revenue</span>
                  <span>{formatRupiah(incomeStatement.revenue?.total_revenue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Cost of Sales */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-red-700 mb-2">COST OF SALES</h4>
              <div className="ml-4 space-y-1">
                <div className="flex justify-between">
                  <span>Direct Materials</span>
                  <span>{formatRupiah(incomeStatement.cost_of_sales?.direct_materials || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Direct Labor</span>
                  <span>{formatRupiah(incomeStatement.cost_of_sales?.direct_labor || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manufacturing Overhead</span>
                  <span>{formatRupiah(incomeStatement.cost_of_sales?.manufacturing_overhead || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Cost of Sales</span>
                  <span>({formatRupiah(incomeStatement.cost_of_sales?.total_cogs || 0)})</span>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between font-bold text-lg bg-blue-50 p-2 rounded">
              <span>GROSS PROFIT</span>
              <span className="text-blue-600">{formatRupiah(incomeStatement.gross_profit || 0)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-orange-700 mb-2">OPERATING EXPENSES</h4>
              <div className="ml-4 space-y-1">
                <div className="flex justify-between">
                  <span>Selling Expenses</span>
                  <span>{formatRupiah(incomeStatement.operating_expenses?.selling_expenses || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Administrative Expenses</span>
                  <span>{formatRupiah(incomeStatement.operating_expenses?.administrative_expenses || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Operating Expenses</span>
                  <span>({formatRupiah(incomeStatement.operating_expenses?.total_operating_expenses || 0)})</span>
                </div>
              </div>
            </div>

            {/* Operating Income */}
            <div className="flex justify-between font-bold text-lg bg-green-50 p-2 rounded">
              <span>OPERATING INCOME</span>
              <span className="text-green-600">{formatRupiah(incomeStatement.operating_income || 0)}</span>
            </div>

            {/* Net Income */}
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Income Tax</span>
                <span>({formatRupiah(incomeStatement.income_tax || 0)})</span>
              </div>
              <div className="flex justify-between font-bold text-xl bg-indigo-50 p-3 rounded mt-2">
                <span>NET INCOME</span>
                <span className="text-indigo-600">{formatRupiah(incomeStatement.net_income || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4">🏢 Balance Sheet - As of Dec 31, {selectedYear}</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
              <h4 className="font-bold text-green-700 mb-4 text-lg">ASSETS</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2">Current Assets</h5>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span>{formatRupiah(balanceSheet.assets.current_assets.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accounts Receivable</span>
                      <span>{formatRupiah(balanceSheet.assets.current_assets.accounts_receivable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inventory</span>
                      <span>{formatRupiah(balanceSheet.assets.current_assets.inventory)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prepaid Expenses</span>
                      <span>{formatRupiah(balanceSheet.assets.current_assets.prepaid_expenses)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total Current Assets</span>
                      <span>{formatRupiah(balanceSheet.assets.current_assets.total_current_assets)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Fixed Assets</h5>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Property, Plant & Equipment</span>
                      <span>{formatRupiah(balanceSheet.assets.fixed_assets.property_plant_equipment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Less: Accumulated Depreciation</span>
                      <span>({formatRupiah(Math.abs(balanceSheet.assets.fixed_assets.accumulated_depreciation))})</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Net Fixed Assets</span>
                      <span>{formatRupiah(balanceSheet.assets.fixed_assets.net_fixed_assets)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg bg-green-50 p-2 rounded">
                  <span>TOTAL ASSETS</span>
                  <span>{formatRupiah(balanceSheet.assets.total_assets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div>
              <h4 className="font-bold text-red-700 mb-4 text-lg">LIABILITIES & EQUITY</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2">Current Liabilities</h5>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Accounts Payable</span>
                      <span>{formatRupiah(balanceSheet.liabilities.current_liabilities.accounts_payable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accrued Liabilities</span>
                      <span>{formatRupiah(balanceSheet.liabilities.current_liabilities.accrued_liabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Short-term Debt</span>
                      <span>{formatRupiah(balanceSheet.liabilities.current_liabilities.short_term_debt)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total Current Liabilities</span>
                      <span>{formatRupiah(balanceSheet.liabilities.current_liabilities.total_current_liabilities)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Long-term Liabilities</h5>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Long-term Debt</span>
                      <span>{formatRupiah(balanceSheet.liabilities.long_term_liabilities.long_term_debt)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total Long-term Liabilities</span>
                      <span>{formatRupiah(balanceSheet.liabilities.long_term_liabilities.total_long_term_liabilities)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between font-semibold bg-red-50 p-2 rounded">
                  <span>TOTAL LIABILITIES</span>
                  <span>{formatRupiah(balanceSheet.liabilities.total_liabilities)}</span>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Equity</h5>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Common Stock</span>
                      <span>{formatRupiah(balanceSheet.equity.common_stock)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retained Earnings</span>
                      <span>{formatRupiah(balanceSheet.equity.retained_earnings)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total Equity</span>
                      <span>{formatRupiah(balanceSheet.equity.total_equity)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg bg-blue-50 p-2 rounded">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span>{formatRupiah(balanceSheet.total_liabilities_equity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCashFlow = () => {
    if (!cashFlow) return null

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4">💰 Cash Flow Statement - {selectedYear}</h3>
          
          <div className="space-y-6">
            {/* Operating Activities */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-blue-700 mb-3">OPERATING ACTIVITIES</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span>Net Income</span>
                  <span>{formatRupiah(cashFlow.operating_activities.net_income)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Depreciation</span>
                  <span>{formatRupiah(cashFlow.operating_activities.depreciation)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Changes in Working Capital</span>
                  <span>{formatRupiah(cashFlow.operating_activities.changes_in_working_capital)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 bg-blue-50 p-2 rounded">
                  <span>Net Cash from Operations</span>
                  <span className="text-blue-600">{formatRupiah(cashFlow.operating_activities.net_cash_from_operations)}</span>
                </div>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-green-700 mb-3">INVESTING ACTIVITIES</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span>Purchase of Equipment</span>
                  <span>({formatRupiah(Math.abs(cashFlow.investing_activities.purchase_of_equipment))})</span>
                </div>
                <div className="flex justify-between">
                  <span>Sale of Assets</span>
                  <span>{formatRupiah(cashFlow.investing_activities.sale_of_assets)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 bg-green-50 p-2 rounded">
                  <span>Net Cash from Investing</span>
                  <span className="text-green-600">{formatRupiah(cashFlow.investing_activities.net_cash_from_investing)}</span>
                </div>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-purple-700 mb-3">FINANCING ACTIVITIES</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span>Loan Proceeds</span>
                  <span>{formatRupiah(cashFlow.financing_activities.loan_proceeds)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loan Repayments</span>
                  <span>({formatRupiah(Math.abs(cashFlow.financing_activities.loan_repayments))})</span>
                </div>
                <div className="flex justify-between">
                  <span>Dividends Paid</span>
                  <span>({formatRupiah(Math.abs(cashFlow.financing_activities.dividends_paid))})</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 bg-purple-50 p-2 rounded">
                  <span>Net Cash from Financing</span>
                  <span className="text-purple-600">{formatRupiah(cashFlow.financing_activities.net_cash_from_financing)}</span>
                </div>
              </div>
            </div>

            {/* Net Change */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Net Change in Cash</span>
                <span className={cashFlow.net_change_in_cash >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatRupiah(cashFlow.net_change_in_cash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Beginning Cash</span>
                <span>{formatRupiah(cashFlow.beginning_cash)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl bg-indigo-50 p-3 rounded">
                <span>ENDING CASH</span>
                <span className="text-indigo-600">{formatRupiah(cashFlow.ending_cash)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📈 Financial Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial statements and analysis</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button 
            onClick={async () => {
              const reportName = activeReport === 'income' ? 'Income Statement' : 
                               activeReport === 'balance' ? 'Balance Sheet' : 'Cash Flow Statement'
              
              try {
                let reportData
                if (activeReport === 'income') {
                  reportData = incomeStatement ? [
                    { Item: 'Sales Revenue', Amount: incomeStatement.revenue?.sales_revenue || 0 },
                    { Item: 'Other Income', Amount: incomeStatement.revenue?.other_income || 0 },
                    { Item: 'Total Revenue', Amount: incomeStatement.revenue?.total_revenue || 0 },
                    { Item: 'Direct Materials', Amount: -(incomeStatement.cost_of_sales?.direct_materials || 0) },
                    { Item: 'Direct Labor', Amount: -(incomeStatement.cost_of_sales?.direct_labor || 0) },
                    { Item: 'Manufacturing Overhead', Amount: -(incomeStatement.cost_of_sales?.manufacturing_overhead || 0) },
                    { Item: 'Gross Profit', Amount: incomeStatement.gross_profit || 0 },
                    { Item: 'Operating Expenses', Amount: -(incomeStatement.operating_expenses?.total_operating_expenses || 0) },
                    { Item: 'Net Income', Amount: incomeStatement.net_income || 0 }
                  ] : []
                } else if (activeReport === 'balance') {
                  reportData = balanceSheet ? [
                    { Category: 'Current Assets', Item: 'Cash', Amount: balanceSheet.assets?.current_assets?.cash || 0 },
                    { Category: 'Current Assets', Item: 'Accounts Receivable', Amount: balanceSheet.assets?.current_assets?.accounts_receivable || 0 },
                    { Category: 'Current Assets', Item: 'Inventory', Amount: balanceSheet.assets?.current_assets?.inventory || 0 },
                    { Category: 'Fixed Assets', Item: 'Property Plant Equipment', Amount: balanceSheet.assets?.fixed_assets?.property_plant_equipment || 0 },
                    { Category: 'Current Liabilities', Item: 'Accounts Payable', Amount: balanceSheet.liabilities?.current_liabilities?.accounts_payable || 0 },
                    { Category: 'Current Liabilities', Item: 'Short Term Debt', Amount: balanceSheet.liabilities?.current_liabilities?.short_term_debt || 0 },
                    { Category: 'Equity', Item: 'Common Stock', Amount: balanceSheet.equity?.common_stock || 0 },
                    { Category: 'Equity', Item: 'Retained Earnings', Amount: balanceSheet.equity?.retained_earnings || 0 }
                  ] : []
                } else {
                  reportData = cashFlow ? [
                    { Activity: 'Operating Activities', Item: 'Net Income', Amount: cashFlow.operating_activities?.net_income || 0 },
                    { Activity: 'Operating Activities', Item: 'Depreciation', Amount: cashFlow.operating_activities?.depreciation || 0 },
                    { Activity: 'Operating Activities', Item: 'Working Capital Changes', Amount: cashFlow.operating_activities?.changes_in_working_capital || 0 },
                    { Activity: 'Investing Activities', Item: 'Purchase of Equipment', Amount: cashFlow.investing_activities?.purchase_of_equipment || 0 },
                    { Activity: 'Financing Activities', Item: 'Loan Proceeds', Amount: cashFlow.financing_activities?.loan_proceeds || 0 },
                    { Activity: 'Financing Activities', Item: 'Dividends Paid', Amount: cashFlow.financing_activities?.dividends_paid || 0 }
                  ] : []
                }
                
                await generatePDFReport(`${activeReport}-statement-${selectedYear}`, {
                  title: `${reportName} - ${selectedYear}`,
                  data: reportData,
                  company: 'ERP System',
                  period: selectedYear
                })
              } catch (error) {
                console.error('Export error:', error)
              }
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveReport('income')}
              className={`py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 ${
                activeReport === 'income'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5" />
              Income Statement
            </button>
            <button
              onClick={() => setActiveReport('balance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 ${
                activeReport === 'balance'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              Balance Sheet
            </button>
            <button
              onClick={() => setActiveReport('cashflow')}
              className={`py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 ${
                activeReport === 'cashflow'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BanknotesIcon className="h-5 w-5" />
              Cash Flow
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeReport === 'income' && renderIncomeStatement()}
          {activeReport === 'balance' && renderBalanceSheet()}
          {activeReport === 'cashflow' && renderCashFlow()}
        </div>
      </div>
    </div>
  )
}

export default FinancialReports
