import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  FunnelIcon,
  PlusIcon,
  TableCellsIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface DataSource {
  id: string
  name: string
  table: string
  fields: { name: string; type: string; label: string }[]
}

interface ReportField {
  source: string
  field: string
  label: string
  aggregation?: string
}

interface ReportFilter {
  field: string
  operator: string
  value: string
  label: string
}

interface CustomReport {
  name: string
  description: string
  dataSources: string[]
  fields: ReportField[]
  filters: ReportFilter[]
  groupBy: string[]
  orderBy: { field: string; direction: 'asc' | 'desc' }[]
  chartType: string
  refreshInterval: string
}

const dataSources: DataSource[] = [
  {
    id: 'sales',
    name: 'Sales Orders',
    table: 'sales_orders',
    fields: [
      { name: 'order_number', type: 'string', label: 'Order Number' },
      { name: 'customer_name', type: 'string', label: 'Customer Name' },
      { name: 'total_amount', type: 'number', label: 'Total Amount' },
      { name: 'order_date', type: 'date', label: 'Order Date' },
      { name: 'status', type: 'string', label: 'Status' },
      { name: 'sales_rep', type: 'string', label: 'Sales Representative' }
    ]
  },
  {
    id: 'production',
    name: 'Work Orders',
    table: 'work_orders',
    fields: [
      { name: 'work_order_number', type: 'string', label: 'Work Order Number' },
      { name: 'product_name', type: 'string', label: 'Product Name' },
      { name: 'quantity', type: 'number', label: 'Quantity' },
      { name: 'start_date', type: 'date', label: 'Start Date' },
      { name: 'end_date', type: 'date', label: 'End Date' },
      { name: 'status', type: 'string', label: 'Status' },
      { name: 'machine_name', type: 'string', label: 'Machine Name' }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory',
    table: 'inventory',
    fields: [
      { name: 'product_name', type: 'string', label: 'Product Name' },
      { name: 'sku', type: 'string', label: 'SKU' },
      { name: 'current_stock', type: 'number', label: 'Current Stock' },
      { name: 'minimum_stock', type: 'number', label: 'Minimum Stock' },
      { name: 'location', type: 'string', label: 'Location' },
      { name: 'last_updated', type: 'date', label: 'Last Updated' }
    ]
  },
  {
    id: 'quality',
    name: 'Quality Tests',
    table: 'quality_tests',
    fields: [
      { name: 'test_number', type: 'string', label: 'Test Number' },
      { name: 'product_name', type: 'string', label: 'Product Name' },
      { name: 'test_date', type: 'date', label: 'Test Date' },
      { name: 'result', type: 'string', label: 'Result' },
      { name: 'defect_count', type: 'number', label: 'Defect Count' },
      { name: 'inspector', type: 'string', label: 'Inspector' }
    ]
  },
  {
    id: 'waste',
    name: 'Waste Records',
    table: 'waste_records',
    fields: [
      { name: 'record_number', type: 'string', label: 'Record Number' },
      { name: 'waste_date', type: 'date', label: 'Waste Date' },
      { name: 'category', type: 'string', label: 'Category' },
      { name: 'quantity', type: 'number', label: 'Quantity' },
      { name: 'hazard_level', type: 'string', label: 'Hazard Level' },
      { name: 'disposal_method', type: 'string', label: 'Disposal Method' }
    ]
  },
  {
    id: 'maintenance',
    name: 'Maintenance Records',
    table: 'maintenance_records',
    fields: [
      { name: 'record_number', type: 'string', label: 'Record Number' },
      { name: 'machine_name', type: 'string', label: 'Machine Name' },
      { name: 'maintenance_date', type: 'date', label: 'Maintenance Date' },
      { name: 'maintenance_type', type: 'string', label: 'Maintenance Type' },
      { name: 'status', type: 'string', label: 'Status' },
      { name: 'cost', type: 'number', label: 'Cost' }
    ]
  }
]

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In List' }
]

const aggregations = [
  { value: '', label: 'None' },
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' }
]

const chartTypes = [
  { value: 'table', label: 'Table', icon: TableCellsIcon },
  { value: 'bar', label: 'Bar Chart', icon: ChartBarIcon },
  { value: 'line', label: 'Line Chart', icon: ChartBarIcon },
  { value: 'pie', label: 'Pie Chart', icon: ChartBarIcon },
  { value: 'area', label: 'Area Chart', icon: ChartBarIcon }
]

export default function CustomReportBuilder() {
const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [report, setReport] = useState<CustomReport>({
    name: '',
    description: '',
    dataSources: [],
    fields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    chartType: 'table',
    refreshInterval: 'manual'
  })
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const addDataSource = (sourceId: string) => {
    if (!report.dataSources.includes(sourceId)) {
      setReport(prev => ({
        ...prev,
        dataSources: [...prev.dataSources, sourceId]
      }))
    }
  }

  const removeDataSource = (sourceId: string) => {
    setReport(prev => ({
      ...prev,
      dataSources: prev.dataSources.filter(id => id !== sourceId),
      fields: prev.fields.filter(field => field.source !== sourceId)
    }))
  }

  const addField = (source: string, fieldName: string) => {
    const dataSource = dataSources.find(ds => ds.id === source)
    const field = dataSource?.fields.find(f => f.name === fieldName)
    
    if (field && !report.fields.some(f => f.source === source && f.field === fieldName)) {
      setReport(prev => ({
        ...prev,
        fields: [...prev.fields, {
          source,
          field: fieldName,
          label: field.label,
          aggregation: ''
        }]
      }))
    }
  }

  const removeField = (index: number) => {
    setReport(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const updateFieldAggregation = (index: number, aggregation: string) => {
    setReport(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, aggregation } : field
      )
    }))
  }

  const addFilter = () => {
    setReport(prev => ({
      ...prev,
      filters: [...prev.filters, {
        field: '',
        operator: 'equals',
        value: '',
        label: ''
      }]
    }))
  }

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }))
  }

  const removeFilter = (index: number) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }))
  }

  const generatePreview = async () => {
    setIsGenerating(true)
    try {
      // Simulate data generation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData = Array.from({ length: 10 }, (_, i) => {
        const row: any = {}
        report.fields.forEach(field => {
          if (field.field.includes('date')) {
            row[field.label] = new Date().toISOString().split('T')[0]
          } else if (field.field.includes('amount') || field.field.includes('cost') || field.field.includes('quantity')) {
            row[field.label] = Math.floor(Math.random() * 1000000)
          } else if (field.field.includes('number')) {
            row[field.label] = `${field.field.toUpperCase()}-${String(i + 1).padStart(3, '0')}`
          } else {
            row[field.label] = `Sample ${field.label} ${i + 1}`
          }
        })
        return row
      })
      
      setPreviewData(mockData)
      toast.success('Preview generated successfully!')
    } catch (error) {
      toast.error('Failed to generate preview')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveReport = () => {
    if (!report.name.trim()) {
      toast.error('Please enter a report name')
      return
    }
    
    if (report.fields.length === 0) {
      toast.error('Please select at least one field')
      return
    }
    
    // Simulate saving
    toast.success('Custom report saved successfully!')
    navigate('/app/reports')
  }

  const getAvailableFields = () => {
    return report.dataSources.flatMap(sourceId => {
      const source = dataSources.find(ds => ds.id === sourceId)
      return source?.fields.map(field => ({
        ...field,
        sourceId,
        sourceName: source.name
      })) || []
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
          <p className="text-gray-600">Create custom reports with your own data sources and filters</p>
        </div>
        <button
          onClick={() => navigate('/app/reports')}
          className="btn-secondary"
        >
          ← Back to Reports
        </button>
      </div>

      {/* Progress Steps */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: 'Basic Info', icon: Cog6ToothIcon },
            { step: 2, title: 'Data Sources', icon: TableCellsIcon },
            { step: 3, title: 'Fields & Filters', icon: FunnelIcon },
            { step: 4, title: 'Preview & Save', icon: EyeIcon }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= item.step 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= item.step ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {item.title}
              </span>
              {index < 3 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  step > item.step ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Report Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={report.name}
                  onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={report.description}
                  onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this report shows"
                  rows={3}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Interval
                </label>
                <select
                  value={report.refreshInterval}
                  onChange={(e) => setReport(prev => ({ ...prev, refreshInterval: e.target.value }))}
                  className="input"
                >
                  <option value="manual">Manual</option>
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Data Sources */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Select Data Sources</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      report.dataSources.includes(source.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (report.dataSources.includes(source.id)) {
                        removeDataSource(source.id)
                      } else {
                        addDataSource(source.id)
                      }
                    }}
                  >
                    <h4 className="font-medium text-gray-900">{source.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {source.fields.length} fields available
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {source.fields.slice(0, 3).map((field) => (
                        <span key={field.name} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {field.label}
                        </span>
                      ))}
                      {source.fields.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{source.fields.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Fields & Filters */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Fields Selection */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Select Fields</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Fields</h4>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {getAvailableFields().map((field) => (
                        <div
                          key={`${field.sourceId}-${field.name}`}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => addField(field.sourceId, field.name)}
                        >
                          <div>
                            <span className="text-sm text-gray-900">{field.label}</span>
                            <span className="text-xs text-gray-500 ml-2">({field.sourceName})</span>
                          </div>
                          <PlusIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Fields</h4>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {report.fields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded mb-2">
                          <div className="flex-1">
                            <span className="text-sm text-gray-900">{field.label}</span>
                            <select
                              value={field.aggregation}
                              onChange={(e) => updateFieldAggregation(index, e.target.value)}
                              className="ml-2 text-xs border rounded px-1"
                            >
                              {aggregations.map((agg) => (
                                <option key={agg.value} value={agg.value}>
                                  {agg.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => removeField(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={addFilter}
                    className="btn-secondary text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add FunnelIcon
                  </button>
                </div>

                <div className="space-y-3">
                  {report.filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, { field: e.target.value })}
                        className="input flex-1"
                      >
                        <option value="">Select Field</option>
                        {getAvailableFields().map((field) => (
                          <option key={`${field.sourceId}-${field.name}`} value={field.name}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, { operator: e.target.value })}
                        className="input"
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="FunnelIcon value"
                        className="input flex-1"
                      />

                      <button
                        onClick={() => removeFilter(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Save */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Chart Type Selection */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Display Options</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {chartTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setReport(prev => ({ ...prev, chartType: type.value }))}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        report.chartType === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                  <button
                    onClick={generatePreview}
                    disabled={isGenerating}
                    className="btn-secondary"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Preview'}
                  </button>
                </div>

                {previewData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {report.fields.map((field) => (
                            <th
                              key={field.field}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, index) => (
                          <tr key={index}>
                            {report.fields.map((field) => (
                              <td key={field.field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row[field.label]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Click "Generate Preview" to see sample data</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Summary */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Report Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{report.name || 'Untitled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Sources:</span>
                <span className="font-medium">{report.dataSources.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fields:</span>
                <span className="font-medium">{report.fields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filters:</span>
                <span className="font-medium">{report.filters.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chart Type:</span>
                <span className="font-medium capitalize">{report.chartType}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="card p-4">
            <div className="space-y-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary w-full"
                >
                  ← Previous Step
                </button>
              )}
              
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !report.name.trim()) ||
                    (step === 2 && report.dataSources.length === 0) ||
                    (step === 3 && report.fields.length === 0)
                  }
                  className="btn-primary w-full"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={saveReport}
                  className="btn-primary w-full"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Save Report
                </button>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="card p-4 bg-blue-50 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {step === 1 && (
                <>
                  <li>• Choose a descriptive name</li>
                  <li>• Set appropriate refresh interval</li>
                </>
              )}
              {step === 2 && (
                <>
                  <li>• Select related data sources</li>
                  <li>• More sources = more complex joins</li>
                </>
              )}
              {step === 3 && (
                <>
                  <li>• Use aggregations for summaries</li>
                  <li>• Add filters to focus data</li>
                </>
              )}
              {step === 4 && (
                <>
                  <li>• Preview before saving</li>
                  <li>• Choose appropriate chart type</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
