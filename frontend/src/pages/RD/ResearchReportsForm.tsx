import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  BeakerIcon as Beaker,
  ChartBarIcon,
  CheckCircleIcon as CheckCircle,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FunnelIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon as Target
} from '@heroicons/react/24/outline';
interface ReportFilters {
  report_type: string;
  date_from: string;
  date_to: string;
  project_id: string;
  project_type: string;
  department: string;
  status: string;
}

interface ReportData {
  summary: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_budget: number;
    budget_utilized: number;
    average_duration: number;
    success_rate: number;
    roi: number;
  };
  charts: {
    projects_by_type: Array<{ name: string; value: number; color: string }>;
    projects_by_status: Array<{ name: string; value: number; color: string }>;
    budget_utilization: Array<{ month: string; allocated: number; spent: number; projects: number }>;
    completion_trends: Array<{ month: string; completed: number; started: number }>;
    department_performance: Array<{ department: string; projects: number; budget: number; success_rate: number }>;
    roi_analysis: Array<{ project_type: string; investment: number; returns: number; roi: number }>;
  };
  projects: Array<{
    project_number: string;
    project_name: string;
    type: string;
    status: string;
    start_date: string;
    end_date: string;
    budget_allocated: number;
    budget_spent: number;
    progress: number;
    manager: string;
  }>;
}

const ResearchReportsForm: React.FC = () => {
  const { t } = useLanguage();

  const [filters, setFilters] = useState<ReportFilters>({
    report_type: 'overview',
    date_from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    project_id: '',
    project_type: '',
    department: '',
    status: ''
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const reportTypes = [
    { value: 'overview', label: 'Overview Report', icon: ChartBarIcon },
    { value: 'performance', label: 'Performance Analysis', icon: ArrowTrendingUpIcon },
    { value: 'budget_analysis', label: 'Budget Analysis', icon: CurrencyDollarIcon },
    { value: 'roi_analysis', label: 'ROI Analysis', icon: Target },
    { value: 'department_comparison', label: 'Department Comparison', icon: UsersIcon },
    { value: 'detailed', label: 'Detailed Report', icon: DocumentTextIcon }
  ];

  const projectTypes = [
    'research',
    'development',
    'innovation',
    'improvement',
    'feasibility'
  ];

  const statusOptions = [
    'planning',
    'active',
    'on_hold',
    'completed',
    'cancelled'
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/rd/projects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/hr/departments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments?.map((d: any) => d.name) || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/rd/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('format', format);

      const response = await fetch(`/api/rd/reports/export?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rd_report_${filters.report_type}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Error exporting report');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research & Development Reports</h1>
          <p className="text-gray-600">Comprehensive R&D project analysis and performance reporting</p>
        </div>
        
        {reportData && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportReport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <ArrowDownTrayIcon className="inline h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <ArrowDownTrayIcon className="inline h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <FunnelIcon className="inline h-4 w-4 mr-1" />
          Report Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              name="report_type"
              value={filters.report_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              name="project_id"
              value={filters.project_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.project_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
            <select
              name="project_type"
              value={filters.project_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                <>
                  <ChartBarIcon className="inline h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <Beaker className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_projects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.summary.active_projects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.total_budget)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.summary.success_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {((reportData.summary.completed_projects / reportData.summary.total_projects) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {((reportData.summary.budget_utilized / reportData.summary.total_budget) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Budget Utilization</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {reportData.summary.average_duration.toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">Avg Duration (days)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {reportData.summary.roi.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">ROI</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects by Type */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.charts.projects_by_type}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.charts.projects_by_type.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Projects by Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.charts.projects_by_status}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Utilization */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Utilization Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.charts.budget_utilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#3B82F6" name="Allocated" />
                  <Bar dataKey="spent" fill="#10B981" name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Completion Trends */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Completion Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.charts.completion_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
                  <Line type="monotone" dataKey="started" stroke="#3B82F6" name="Started" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Performance */}
          {filters.report_type === 'department_comparison' && reportData.charts.department_performance.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.charts.department_performance.map((dept, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {dept.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.projects}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(dept.budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.success_rate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Projects Table */}
          {filters.report_type === 'detailed' && reportData.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Project Report</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.projects.map((project, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{project.project_number}</div>
                            <div className="text-sm text-gray-500">{project.project_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.type.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(project.start_date).toLocaleDateString()} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatCurrency(project.budget_allocated)}</div>
                          <div className="text-xs text-gray-400">Spent: {formatCurrency(project.budget_spent)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="ml-2">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.manager}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-600 mb-4">
              Configure your filters and click "Generate Report" to view R&D analytics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchReportsForm;
