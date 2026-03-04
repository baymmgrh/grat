import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  CurrencyDollarIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon as StatusIcon,
  PauseIcon,
  PlayIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import EfficiencyAlerts from '../../components/Production/EfficiencyAlerts'
interface DashboardData {
  work_orders: {
    total: number
    active: number
    completed: number
  }
  machines: {
    total_active: number
    status_breakdown: { [key: string]: number }
  }
}

interface QuickStat {
  name: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<any>
  color: string
}

const ProductionDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/production/dashboard/summary')
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const quickStats: QuickStat[] = [
    {
      name: 'Active Work Orders',
      value: dashboardData?.work_orders.active || 0,
      icon: PlayIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Completed Orders',
      value: dashboardData?.work_orders.completed || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Active Machines',
      value: dashboardData?.machines.total_active || 0,
      icon: CogIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Running Machines',
      value: dashboardData?.machines.status_breakdown?.running || 0,
      icon: WrenchScrewdriverIcon,
      color: 'bg-orange-500'
    }
  ]

  const moduleCards = [
    {
      title: 'Work Orders',
      description: 'Create, manage and track production work orders',
      icon: ClipboardDocumentListIcon,
      href: '/app/production/work-orders',
      color: 'bg-blue-500',
      stats: `${dashboardData?.work_orders.total || 0} total orders`
    },
    {
      title: 'Production Scheduling',
      description: 'Schedule and optimize machine production slots',
      icon: CalendarDaysIcon,
      href: '/app/production/scheduling',
      color: 'bg-green-500',
      stats: 'Smart scheduling system'
    },
    {
      title: 'Machine Data',
      description: 'Monitor and manage production machines',
      icon: CogIcon,
      href: '/app/production/machines',
      color: 'bg-purple-500',
      stats: `${dashboardData?.machines.total_active || 0} active machines`
    },
    {
      title: 'Production Records',
      description: 'Track daily production output and quality',
      icon: ChartBarIcon,
      href: '/app/production/records',
      color: 'bg-orange-500',
      stats: 'Real-time tracking'
    },
    {
      title: 'Efficiency Tracking',
      description: 'Monitor OEE, downtime and performance metrics',
      icon: ChartBarIcon,
      href: '/app/production/efficiency',
      color: 'bg-yellow-500',
      stats: 'OEE & Performance'
    },
    {
      title: 'Traceability',
      description: 'Track product batches and production history',
      icon: DocumentMagnifyingGlassIcon,
      href: '/app/production/traceability',
      color: 'bg-indigo-500',
      stats: 'Full batch tracking'
    },
    {
      title: 'WIP & Job Costing',
      description: 'Work in Progress tracking and job cost analysis',
      icon: CurrencyDollarIcon,
      href: '/app/production/wip',
      color: 'bg-emerald-500',
      stats: 'Real-time WIP monitoring'
    },
    {
      title: 'Work Roster',
      description: 'Jadwal kerja operator, QC, maintenance, dan packing',
      icon: UserGroupIcon,
      href: '/app/hr/roster',
      color: 'bg-pink-500',
      stats: 'Manajemen jadwal lengkap'
    }
  ]

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'maintenance': return 'bg-blue-500'
      case 'breakdown': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getMachineStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return PlayIcon
      case 'idle': return PauseIcon
      case 'maintenance': return WrenchScrewdriverIcon
      case 'breakdown': return ExclamationTriangleIcon
      default: return CogIcon
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏭 Production Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your production operations</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="btn-secondary"
        >
          Refresh Data
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Efficiency Alerts */}
      <EfficiencyAlerts />

      {/* Machine Status Overview */}
      {dashboardData?.machines.status_breakdown && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Machine Status Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(dashboardData.machines.status_breakdown).map(([status, count]) => {
              const StatusIcon = getMachineStatusIcon(status)
              return (
                <div key={status} className="flex items-center space-x-3">
                  <div className={`${getMachineStatusColor(status)} p-2 rounded-lg`}>
                    <StatusIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 capitalize">{status}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Production Modules */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleCards.map((module, index) => (
            <Link
              key={index}
              to={module.href}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className={`${module.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {module.title}
                  </h4>
                  <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{module.stats}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/app/production/work-orders/new" className="btn-primary">
            + New Work Order
          </Link>
          <Link to="/app/production/scheduling" className="btn-secondary">
            📅 View Schedule
          </Link>
          <Link to="/app/production/machines" className="btn-secondary">
            🔧 Machine Status
          </Link>
          <Link to="/app/production/records" className="btn-secondary">
            📊 Production Records
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProductionDashboard
