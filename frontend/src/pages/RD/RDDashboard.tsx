import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useGetRDDashboardQuery } from '../../services/api'
import { CardSkeleton, ListSkeleton } from '../../components/ui/Skeleton';

export default function RDDashboard() {
  const { data: dashboardData, isLoading } = useGetRDDashboardQuery(undefined)

  const summary = dashboardData?.summary || {}
  const recentProjects = dashboardData?.recent_projects || []
  const recentExperiments = dashboardData?.recent_experiments || []

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <LightBulbIcon className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">R&D Dashboard</h1>
            </div>
            <p className="text-purple-100 mt-2">Research & Development Management Center</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/app/rd/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              New Project
            </Link>
            <Link
              to="/app/rd/experiments/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <BeakerIcon className="h-5 w-5" />
              New Experiment
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Card */}
        {isLoading ? <CardSkeleton /> : (
          <div className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Research Projects</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.projects?.total || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                {summary.projects?.active || 0} active
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">
                {summary.projects?.completed || 0} done
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm">
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{summary.projects?.completion_rate?.toFixed(1) || 0}%</span>
              <span className="text-slate-500 dark:text-slate-400">completion</span>
            </div>
          </div>
        )}

        {/* Experiments Card */}
        {isLoading ? <CardSkeleton /> : (
          <div className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Experiments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.experiments?.total || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <BeakerIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-400">Success Rate</span>
                <span className="font-semibold text-slate-900 dark:text-white">{summary.experiments?.success_rate?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary.experiments?.success_rate || 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Products Card */}
        {isLoading ? <CardSkeleton /> : (
          <div className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Product Development</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.products?.total || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <RocketLaunchIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{summary.products?.launched || 0}</span> launched
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{summary.products?.launch_rate?.toFixed(1) || 0}%</span>
              <span className="text-slate-500 dark:text-slate-400">launch rate</span>
            </div>
          </div>
        )}

        {/* Budget Card */}
        {isLoading ? <CardSkeleton /> : (
          <div className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget Utilization</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {summary.budget?.utilization_rate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Rp {((summary.budget?.total_spent || 0) / 1000000).toFixed(1)}M spent
            </p>
            <div className="mt-3">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    (summary.budget?.utilization_rate || 0) > 90 
                      ? 'bg-gradient-to-r from-red-400 to-red-500' 
                      : 'bg-gradient-to-r from-amber-400 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(summary.budget?.utilization_rate || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: '/app/rd/projects', icon: ClipboardDocumentListIcon, label: 'Projects', color: 'blue' },
            { to: '/app/rd/experiments', icon: BeakerIcon, label: 'Experiments', color: 'purple' },
            { to: '/app/rd/products', icon: RocketLaunchIcon, label: 'Products', color: 'emerald' },
            { to: '/app/rd/materials', icon: CubeIcon, label: 'Materials', color: 'amber' },
            { to: '/app/rd/reports', icon: DocumentTextIcon, label: 'Reports', color: 'indigo' },
            { to: '/app/rd/projects/new', icon: PlusIcon, label: 'New Project', color: 'rose' },
          ].map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              className={`flex flex-col items-center p-4 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-700/50 hover:border-${item.color}-300 dark:hover:border-${item.color}-600 hover:bg-${item.color}-50 dark:hover:bg-${item.color}-900/20 transition-all duration-200 group`}
            >
              <div className={`p-3 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30 group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-6 w-6 text-${item.color}-600 dark:text-${item.color}-400`} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        {isLoading ? <ListSkeleton rows={4} /> : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Recent Projects</h2>
              </div>
              <Link to="/app/rd/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentProjects.length > 0 ? (
                recentProjects.slice(0, 5).map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">{project.project_name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{project.project_number}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(project.status)}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p>No recent projects</p>
                  <Link to="/app/rd/projects/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    Create your first project
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Experiments */}
        {isLoading ? <ListSkeleton rows={4} /> : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BeakerIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Recent Experiments</h2>
              </div>
              <Link to="/app/rd/experiments" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentExperiments.length > 0 ? (
                recentExperiments.slice(0, 5).map((experiment: any) => (
                  <div key={experiment.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">{experiment.experiment_name}</h3>
                        {experiment.success && (
                          <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{experiment.experiment_number}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(experiment.status)}`}>
                      {experiment.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <BeakerIcon className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p>No recent experiments</p>
                  <Link to="/app/rd/experiments/new" className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2 inline-block">
                    Start your first experiment
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alerts & Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alerts & Notifications</h2>
        </div>
        <div className="space-y-3">
          {/* Pending Materials */}
          {summary.materials?.pending > 0 && (
            <div className="flex items-center p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {summary.materials.pending} material requests pending approval
                </p>
              </div>
              <Link to="/app/rd/materials?status=requested" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                Review →
              </Link>
            </div>
          )}

          {/* High Budget Utilization */}
          {(summary.budget?.utilization_rate || 0) > 90 && (
            <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Budget utilization is high ({summary.budget?.utilization_rate?.toFixed(1)}%)
                </p>
              </div>
              <Link to="/app/rd/reports" className="text-red-600 hover:text-red-700 text-sm font-medium">
                View Details →
              </Link>
            </div>
          )}

          {/* No active projects */}
          {(summary.projects?.active || 0) === 0 && (
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  No active research projects. Consider starting a new project.
                </p>
              </div>
              <Link to="/app/rd/projects/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Create Project →
              </Link>
            </div>
          )}

          {/* All good */}
          {(summary.materials?.pending || 0) === 0 && (summary.budget?.utilization_rate || 0) < 90 && (summary.projects?.active || 0) > 0 && (
            <div className="flex items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  All systems running smoothly. No immediate action required.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    planning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    testing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    planned: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    concept: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    development: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
  return styles[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
}
