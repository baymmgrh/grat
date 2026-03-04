import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  PrinterIcon,
  TableCellsIcon

} from '@heroicons/react/24/outline';
import {
  useGetSalesOrdersQuery,
  useGetProductsQuery,
  useGetInventoryQuery,
  useGetWorkOrdersQuery,
  useGetWasteRecordsQuery,
  useGetMaintenanceRecordsQuery
} from '../../services/api';
interface ReportConfig {
  id: string
  title: string
  description: string
  dataSource: string
  fields: string[]
  filters: any[]
  chartTypes: string[]
}

const reportConfigs: Record<string, ReportConfig> = {
  'sales-summary': {
    id: 'sales-summary',
    title: 'Sales Summary Report',
    description: 'Comprehensive sales performance analysis',
    dataSource: 'sales',
    fields: ['order_number', 'customer_name', 'total_amount', 'order_date', 'status'],
    filters: [
      { field: 'order_date', type: 'daterange', label: 'Order Date Range' },
      { field: 'status', type: 'select', label: 'Order Status', options: ['pending', 'confirmed', 'shipped', 'delivered'] },
      { field: 'customer_name', type: 'text', label: 'Customer Name' }
    ],
    chartTypes: ['bar', 'line', 'pie']
  },
  'production-efficiency': {
    id: 'production-efficiency',
    title: 'Production Efficiency Report',
    description: 'Machine utilization and production metrics',
    dataSource: 'production',
    fields: ['work_order_number', 'machine_name', 'start_date', 'end_date', 'status', 'efficiency'],
    filters: [
      { field: 'start_date', type: 'daterange', label: 'Production Period' },
      { field: 'machine_name', type: 'text', label: 'Machine Name' },
      { field: 'status', type: 'select', label: 'Status', options: ['pending', 'in_progress', 'completed'] }
    ],
    chartTypes: ['bar', 'line']
  },
  'inventory-status': {
    id: 'inventory-status',
    title: 'Inventory Status Report',
    description: 'Current stock levels and inventory movements',
    dataSource: 'inventory',
    fields: ['product_name', 'sku', 'current_stock', 'minimum_stock', 'location', 'last_updated'],
    filters: [
      { field: 'product_name', type: 'text', label: 'Product Name' },
      { field: 'location', type: 'text', label: 'Location' },
      { field: 'stock_status', type: 'select', label: 'Stock Status', options: ['in_stock', 'low_stock', 'out_of_stock'] }
    ],
    chartTypes: ['bar', 'pie']
  },
  'financial-summary': {
    id: 'financial-summary',
    title: 'Financial Summary Report',
    description: 'Revenue, expenses, profit margins, and cash flow analysis',
    dataSource: 'sales', // Using sales data as proxy for financial data
    fields: ['order_number', 'customer_name', 'total_amount', 'order_date', 'status'],
    filters: [
      { field: 'order_date', type: 'daterange', label: 'Date Range' },
      { field: 'status', type: 'select', label: 'Order Status', options: ['pending', 'confirmed', 'shipped', 'delivered'] }
    ],
    chartTypes: ['bar', 'line', 'pie']
  },
  'shipping-performance': {
    id: 'shipping-performance',
    title: 'Shipping Performance Report',
    description: 'Delivery times, shipping costs, and carrier performance',
    dataSource: 'sales', // Using sales data as proxy for shipping data
    fields: ['order_number', 'customer_name', 'order_date', 'status'],
    filters: [
      { field: 'order_date', type: 'daterange', label: 'Shipping Date Range' },
      { field: 'status', type: 'select', label: 'Delivery Status', options: ['shipped', 'delivered', 'pending'] }
    ],
    chartTypes: ['bar', 'line']
  },
  'quality-metrics': {
    id: 'quality-metrics',
    title: 'Quality Metrics Report',
    description: 'Quality test results and defect analysis',
    dataSource: 'quality',
    fields: ['test_number', 'product_name', 'test_date', 'result', 'defect_count'],
    filters: [
      { field: 'test_date', type: 'daterange', label: 'Test Date Range' },
      { field: 'result', type: 'select', label: 'Test Result', options: ['pass', 'fail', 'pending'] },
      { field: 'product_name', type: 'text', label: 'Product Name' }
    ],
    chartTypes: ['bar', 'pie', 'line']
  },
  'waste-management': {
    id: 'waste-management',
    title: 'Waste Management Report',
    description: 'Waste disposal tracking and environmental compliance',
    dataSource: 'waste',
    fields: ['record_number', 'waste_date', 'category', 'quantity', 'hazard_level', 'disposal_method'],
    filters: [
      { field: 'waste_date', type: 'daterange', label: 'Disposal Date Range' },
      { field: 'category', type: 'text', label: 'Waste Category' },
      { field: 'hazard_level', type: 'select', label: 'Hazard Level', options: ['low', 'medium', 'high', 'hazardous'] }
    ],
    chartTypes: ['bar', 'pie']
  },
  'maintenance-schedule': {
    id: 'maintenance-schedule',
    title: 'Maintenance Schedule Report',
    description: 'Equipment maintenance tracking and scheduling',
    dataSource: 'maintenance',
    fields: ['record_number', 'machine_name', 'maintenance_date', 'maintenance_type', 'status', 'cost'],
    filters: [
      { field: 'maintenance_date', type: 'daterange', label: 'Maintenance Date Range' },
      { field: 'maintenance_type', type: 'text', label: 'Maintenance Type' },
      { field: 'status', type: 'select', label: 'Status', options: ['scheduled', 'in_progress', 'completed'] }
    ],
    chartTypes: ['bar', 'line']
  },
  'hr-analytics': {
    id: 'hr-analytics',
    title: 'HR Analytics Report',
    description: 'Employee statistics, attendance, and workforce analytics',
    dataSource: 'hr',
    fields: ['employee_id', 'name', 'department', 'position', 'status', 'attendance_rate'],
    filters: [
      { field: 'department', type: 'text', label: 'Department' },
      { field: 'status', type: 'select', label: 'Status', options: ['active', 'inactive', 'on_leave'] }
    ],
    chartTypes: ['bar', 'pie']
  },
  'training-progress': {
    id: 'training-progress',
    title: 'Training Progress Report',
    description: 'Employee training completion and skill development',
    dataSource: 'hr',
    fields: ['employee_name', 'training_name', 'start_date', 'end_date', 'status', 'score'],
    filters: [
      { field: 'start_date', type: 'daterange', label: 'Training Period' },
      { field: 'status', type: 'select', label: 'Status', options: ['pending', 'in_progress', 'completed'] }
    ],
    chartTypes: ['bar', 'line']
  },
  'maintenance-summary': {
    id: 'maintenance-summary',
    title: 'Maintenance Summary Report',
    description: 'Equipment maintenance costs and downtime analysis',
    dataSource: 'maintenance',
    fields: ['machine_name', 'maintenance_type', 'total_cost', 'downtime_hours', 'completion_rate'],
    filters: [
      { field: 'maintenance_date', type: 'daterange', label: 'Date Range' },
      { field: 'maintenance_type', type: 'select', label: 'Type', options: ['preventive', 'corrective', 'emergency'] }
    ],
    chartTypes: ['bar', 'pie', 'line']
  }
}

export default function ReportGenerator() {
    const { t } = useLanguage();

const { reportId } = useParams()
  const navigate = useNavigate()
  const [config, setConfig] = useState<ReportConfig | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [chartType, setChartType] = useState('table')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])

  // Data hooks
  const { data: salesData } = useGetSalesOrdersQuery({})
  const { data: productsData } = useGetProductsQuery({})
  const { data: inventoryData } = useGetInventoryQuery({})
  const { data: workOrdersData } = useGetWorkOrdersQuery({})
  const { data: wasteData } = useGetWasteRecordsQuery({})
  const { data: maintenanceData } = useGetMaintenanceRecordsQuery({})

  useEffect(() => {
    if (reportId && reportConfigs[reportId]) {
      const reportConfig = reportConfigs[reportId]
      setConfig(reportConfig)
      setSelectedFields(reportConfig.fields.slice(0, 5)) // Select first 5 fields by default
      
      // Set default filters
      const defaultFilters: Record<string, any> = {}
      reportConfig.filters.forEach(filter => {
        if (filter.type === 'daterange') {
          defaultFilters[filter.field] = dateRange
        }
      })
      setFilters(defaultFilters)
    }
  }, [reportId, dateRange])

  const getDataSource = () => {
    if (!config) return []
    
    switch (config.dataSource) {
      case 'sales':
        return salesData?.orders || []
      case 'production':
        return workOrdersData?.work_orders || []
      case 'inventory':
        return inventoryData?.inventory || []
      case 'waste':
        return wasteData?.records || []
      case 'maintenance':
        return maintenanceData?.records || []
      default:
        return []
    }
  }

  const applyFilters = (data: any[]) => {
    return data.filter(item => {
      return Object.entries(filters).every(([field, value]) => {
        if (!value) return true
        
        if (typeof value === 'object' && value.startDate && value.endDate) {
          const itemDate = new Date(item[field])
          const startDate = new Date(value.startDate)
          const endDate = new Date(value.endDate)
          return itemDate >= startDate && itemDate <= endDate
        }
        
        if (typeof value === 'string') {
          return item[field]?.toString().toLowerCase().includes(value.toLowerCase())
        }
        
        return item[field] === value
      })
    })
  }

  const generateReport = async () => {
    if (!config) return
    
    setIsGenerating(true)
    try {
      const rawData = getDataSource()
      const filteredData = applyFilters(rawData)
      
      // Select only chosen fields
      const processedData = filteredData.map(item => {
        const processedItem: any = {}
        selectedFields.forEach(field => {
          processedItem[field] = item[field]
        })
        return processedItem
      })
      
      setReportData(processedData)
      toast.success('Report generated successfully!')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (reportData.length === 0) {
      toast.error('Please generate report first')
      return
    }
    
    // Simulate export
    toast.success(`Exporting report as ${format.toUpperCase()}...`)
    
    if (format === 'csv') {
      const csvContent = [
        selectedFields.join(','),
        ...reportData.map(row => selectedFields.map(field => row[field] || '').join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config?.id}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Report not found</h2>
          <p className="text-gray-600 mt-2">The requested report configuration could not be loaded.</p>
          <button
            onClick={() => navigate('/app/reports')}
            className="btn-primary mt-4"
          >
            Back to Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-600 mt-1">{config.description}</p>
        </div>
        <button
          onClick={() => navigate('/app/reports')}
          className="btn-secondary"
        >
          ← Back to Reports
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filters */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
            </h3>
            
            <div className="space-y-4">
              {config.filters.map((filter) => (
                <div key={filter.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  
                  {filter.type === 'daterange' && (
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters[filter.field]?.startDate || dateRange.startDate}
                        onChange={(e) => handleFilterChange(filter.field, {
                          ...filters[filter.field],
                          startDate: e.target.value
                        })}
                        className="input text-sm"
                      />
                      <input
                        type="date"
                        value={filters[filter.field]?.endDate || dateRange.endDate}
                        onChange={(e) => handleFilterChange(filter.field, {
                          ...filters[filter.field],
                          endDate: e.target.value
                        })}
                        className="input text-sm"
                      />
                    </div>
                  )}
                  
                  {filter.type === 'select' && (
                    <select
                      value={filters[filter.field] || ''}
                      onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">All</option>
                      {filter.options?.map((option: string) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {filter.type === 'text' && (
                    <input
                      type="text"
                      value={filters[filter.field] || ''}
                      onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                      placeholder={`FunnelIcon by ${filter.label.toLowerCase()}`}
                      className="input text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Select Fields</h3>
            <div className="space-y-2">
              {config.fields.map((field) => (
                <label key={field} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFields([...selectedFields, field])
                      } else {
                        setSelectedFields(selectedFields.filter(f => f !== field))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Display As</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chartType"
                  value="table"
                  checked={chartType === 'table'}
                  onChange={(e) => setChartType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <TableCellsIcon className="h-4 w-4 ml-2 mr-1" />
                <span className="text-sm text-gray-700">Table</span>
              </label>
              {config.chartTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="chartType"
                    value={type}
                    checked={chartType === type}
                    onChange={(e) => setChartType(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <ChartBarIcon className="h-4 w-4 ml-2 mr-1" />
                  <span className="text-sm text-gray-700">
                    {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={isGenerating || selectedFields.length === 0}
            className="btn-primary w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report Display */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-900">Report Results</h3>
              
              {reportData.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className="btn-secondary text-sm"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  </button>
                  <button
                    onClick={() => exportReport('excel')}
                    className="btn-secondary text-sm"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className="btn-secondary text-sm"
                  >
                    <PrinterIcon className="h-4 w-4 mr-1" />
                  </button>
                </div>
              )}
            </div>

            {reportData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Click "Generate Report" to display results</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedFields.map((field) => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.slice(0, 50).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {selectedFields.map((field) => (
                          <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row[field] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {reportData.length > 50 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing first 50 of {reportData.length} records. Export to view all data.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
