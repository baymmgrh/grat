import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  PlayIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface DataSource {
  id: string;
  name: string;
  table: string;
  fields: string[];
}

interface ReportField {
  id: string;
  source: string;
  field: string;
  alias: string;
  aggregation?: string;
  format?: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface CustomReport {
  name: string;
  description: string;
  dataSources: string[];
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy: string[];
  orderBy: string[];
  chartType?: string;
}

const AdvancedReportBuilder: React.FC = () => {
  const { t } = useLanguage();

  const [dataSources] = useState<DataSource[]>([
    {
      id: 'sales',
      name: 'Sales Orders',
      table: 'sales_orders',
      fields: ['order_number', 'customer_name', 'order_date', 'total_amount', 'status']
    },
    {
      id: 'production',
      name: 'Work Orders',
      table: 'work_orders',
      fields: ['work_order_number', 'product_name', 'quantity', 'start_date', 'end_date', 'status']
    },
    {
      id: 'inventory',
      name: 'Inventory',
      table: 'inventory',
      fields: ['product_name', 'current_stock', 'unit_cost', 'total_value', 'location']
    },
    {
      id: 'maintenance',
      name: 'Maintenance Records',
      table: 'maintenance_records',
      fields: ['record_number', 'machine_name', 'maintenance_type', 'cost', 'status']
    },
    {
      id: 'hr',
      name: 'Employees',
      table: 'employees',
      fields: ['employee_number', 'full_name', 'department', 'position', 'salary']
    }
  ]);

  const [report, setReport] = useState<CustomReport>({
    name: '',
    description: '',
    dataSources: [],
    fields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    chartType: 'table'
  });

  const [reportResult, setReportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Add field to report
  const addField = () => {
    const newField: ReportField = {
      id: Date.now().toString(),
      source: '',
      field: '',
      alias: '',
      aggregation: 'none'
    };
    setReport(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  // Update field
  const updateField = (id: string, updates: Partial<ReportField>) => {
    setReport(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  // Remove field
  const removeField = (id: string) => {
    setReport(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== id)
    }));
  };

  // Add filter
  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: ''
    };
    setReport(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  // Update filter
  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.map(filter => 
        filter.id === id ? { ...filter, ...updates } : filter
      )
    }));
  };

  // Remove filter
  const removeFilter = (id: string) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== id)
    }));
  };

  // Generate report
  const generateReport = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.post('/api/reports/custom', {
        report_config: report
      });
      
      setReportResult(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Save report
  const saveReport = async () => {
    try {
      await axiosInstance.post('/api/reports/save', {
        name: report.name,
        description: report.description,
        config: report
      });
      
      alert('Report saved successfully!');
    } catch (error) {
      console.error('Failed to save report:', error);
      alert('Failed to save report');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Report Builder
        </h1>
        <p className="text-gray-600">
          Create custom reports with advanced filtering and visualization options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Report Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={report.name}
                  onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter report name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Type
                </label>
                <select
                  value={report.chartType}
                  onChange={(e) => setReport(prev => ({ ...prev, chartType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="table">Table</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
              <textarea
                value={report.description}
                onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Enter report description"
              />
            </div>
          </div>

          {/* Data Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dataSources.map((source) => (
                <label key={source.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={report.dataSources.includes(source.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReport(prev => ({
                          ...prev,
                          dataSources: [...prev.dataSources, source.id]
                        }));
                      } else {
                        setReport(prev => ({
                          ...prev,
                          dataSources: prev.dataSources.filter(id => id !== source.id)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{source.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Report Fields</h2>
              <button
                onClick={addField}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Field
              </button>
            </div>
            
            <div className="space-y-3">
              {report.fields.map((field) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <select
                      value={field.source}
                      onChange={(e) => updateField(field.id, { source: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select Source</option>
                      {dataSources
                        .filter(ds => report.dataSources.includes(ds.id))
                        .map(ds => (
                          <option key={ds.id} value={ds.id}>{ds.name}</option>
                        ))
                      }
                    </select>
                  </div>
                  
                  <div className="col-span-3">
                    <select
                      value={field.field}
                      onChange={(e) => updateField(field.id, { field: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select Field</option>
                      {field.source && dataSources
                        .find(ds => ds.id === field.source)?.fields
                        .map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))
                      }
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <select
                      value={field.aggregation}
                      onChange={(e) => updateField(field.id, { aggregation: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="count">Count</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                  </div>
                  
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={field.alias}
                      onChange={(e) => updateField(field.id, { alias: e.target.value })}
                      placeholder="Column alias"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <button
                      onClick={() => removeField(field.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={addFilter}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Add FunnelIcon
              </button>
            </div>
            
            <div className="space-y-3">
              {report.filters.map((filter) => (
                <div key={filter.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select Field</option>
                      {report.fields.map(field => (
                        <option key={field.id} value={field.field}>
                          {field.alias || field.field}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-3">
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="contains">Contains</option>
                      <option value="starts_with">Starts With</option>
                    </select>
                  </div>
                  
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      placeholder="FunnelIcon value"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions & Preview */}
        <div className="space-y-6">
          
          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{t('common.actions')}</h2>
            
            <div className="space-y-3">
              <button
                onClick={generateReport}
                disabled={loading || !report.name || report.fields.length === 0}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              
              <button
                onClick={saveReport}
                disabled={!report.name}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Save Report
              </button>
            </div>
          </div>

          {/* Report Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Report Summary</h2>
            
            <div className="space-y-3">
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
        </div>
      </div>

      {/* Report Results */}
      {reportResult && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report Results</h2>
          
          {report.chartType === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {reportResult.columns?.map((col: string, index: number) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-left">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportResult.data?.map((row: any[], index: number) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <ChartBarIcon className="h-12 w-12 text-gray-400" />
              <span className="ml-2 text-gray-500">Chart visualization will be displayed here</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedReportBuilder;
