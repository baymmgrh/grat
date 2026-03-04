import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  CheckCircleIcon,
  CogIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon as StatusIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import ActivityLogModal from '../../components/ActivityLogModal'
interface Machine {
  id: number
  code: string
  name: string
  machine_type: string
  manufacturer?: string
  model?: string
  status: string
  location?: string
  department?: string
  capacity_per_hour?: number
  capacity_uom?: string
  efficiency: number
  availability: number
  last_maintenance?: string
  next_maintenance?: string
  notes?: string
}

const MachineList = () => {
    const { t } = useLanguage();

const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showActivityLog, setShowActivityLog] = useState(false)

  useEffect(() => {
    loadMachines()
  }, [])

  const loadMachines = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/production/machines')
      setMachines(response.data.machines)
    } catch (error) {
      console.error('Error loading machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'idle': return 'bg-yellow-100 text-yellow-800'
      case 'maintenance': return 'bg-blue-100 text-blue-800'
      case 'breakdown': return 'bg-red-100 text-red-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return PlayIcon
      case 'idle': return PauseIcon
      case 'maintenance': return WrenchScrewdriverIcon
      case 'breakdown': return ExclamationTriangleIcon
      case 'offline': return CogIcon
      default: return CogIcon
    }
  }

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || machine.status === statusFilter
    const matchesType = !typeFilter || machine.machine_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const uniqueStatuses = [...new Set(machines.map(m => m.status))]
  const uniqueTypes = [...new Set(machines.map(m => m.machine_type))]

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔧 Machine Data Controller</h1>
          <p className="text-gray-600 mt-1">Monitor and manage production machines</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowActivityLog(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Log Aktivitas
          </button>
          <Link to="/app/production/machines/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Add Machine
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.search')}</label>
            <input
              type="text"
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input mt-1"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status} className="capitalize">{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input mt-1"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setTypeFilter('')
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Machine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map((machine) => {
          const StatusIcon = getStatusIcon(machine.status)
          return (
            <div key={machine.id} className="card p-6 hover:shadow-lg transition-shadow">
              {/* Machine Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{machine.name}</h3>
                  <p className="text-sm text-gray-600">{machine.code}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(machine.status)} flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {machine.status}
                </div>
              </div>

              {/* Machine Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900 capitalize">{machine.machine_type.replace('_', ' ')}</span>
                </div>
                {machine.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{machine.location}</span>
                  </div>
                )}
                {machine.capacity_per_hour && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="text-gray-900">{machine.capacity_per_hour} {machine.capacity_uom}/hr</span>
                  </div>
                )}
              </div>

              {/* Efficiency Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{machine.efficiency}%</div>
                  <div className="text-xs text-gray-600">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{machine.availability}%</div>
                  <div className="text-xs text-gray-600">Availability</div>
                </div>
              </div>

              {/* Maintenance Info */}
              {machine.next_maintenance && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <WrenchScrewdriverIcon className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Next Maintenance</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {new Date(machine.next_maintenance).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Link
                  to={`/app/production/machines/${machine.id}`}
                  className="btn-secondary flex-1 text-center flex items-center justify-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" />
                </Link>
                <Link
                  to={`/app/production/machines/${machine.id}/efficiency`}
                  className="btn-secondary flex-1 text-center flex items-center justify-center gap-1"
                >
                  <ChartBarIcon className="h-4 w-4" />
                </Link>
                <Link
                  to={`/app/production/machines/${machine.id}/edit`}
                  className="btn-primary text-center flex items-center justify-center"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredMachines.length === 0 && (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No machines found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'Get started by adding your first machine'
            }
          </p>
          {!searchTerm && !statusFilter && !typeFilter && (
            <div className="mt-6">
              <Link to="/app/production/machines/new" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Machine
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Activity Log Modal */}
      <ActivityLogModal
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        resourceType="machine"
        title="Log Aktivitas Machine"
      />
    </div>
  )
}

export default MachineList
