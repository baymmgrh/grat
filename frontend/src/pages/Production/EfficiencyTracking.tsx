import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface Machine {
  id: number
  code: string
  name: string
  status: string
  efficiency: number
  availability: number
}

interface EfficiencyData {
  machine_id: number
  machine_name: string
  period: {
    start: string
    end: string
    days: number
  }
  production: {
    total_produced: number
    total_good: number
    total_scrap: number
    quality_rate: number
    scrap_rate: number
  }
  availability: {
    theoretical_hours: number
    total_downtime_hours: number
    actual_runtime_hours: number
    availability_rate: number
  }
  efficiency: {
    performance_rate: number
    oee: number
  }
}

const EfficiencyTracking = () => {
    const { t } = useLanguage();

const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null)
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingEfficiency, setLoadingEfficiency] = useState(false)
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadMachines()
  }, [])

  useEffect(() => {
    if (selectedMachine) {
      loadEfficiencyData()
    }
  }, [selectedMachine, dateRange])

  const loadMachines = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/production/machines')
      setMachines(response.data.machines)
      
      // Auto-select first machine
      if (response.data.machines.length > 0) {
        setSelectedMachine(response.data.machines[0].id)
      }
    } catch (error) {
      console.error('Error loading machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEfficiencyData = async () => {
    if (!selectedMachine) return
    
    try {
      setLoadingEfficiency(true)
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      })
      
      const response = await axiosInstance.get(`/api/production/machines/${selectedMachine}/efficiency?${params}`)
      setEfficiencyData(response.data)
    } catch (error) {
      console.error('Error loading efficiency data:', error)
    } finally {
      setLoadingEfficiency(false)
    }
  }

  const getEfficiencyColor = (value: number, type: 'oee' | 'availability' | 'quality') => {
    const thresholds = {
      oee: { good: 75, average: 50 },
      availability: { good: 85, average: 70 },
      quality: { good: 95, average: 90 }
    }
    
    const threshold = thresholds[type]
    if (value >= threshold.good) return 'text-green-600'
    if (value >= threshold.average) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEfficiencyIcon = (value: number, previousValue?: number) => {
    if (!previousValue) return null
    
    if (value > previousValue) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    } else if (value < previousValue) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    }
    return null
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const selectedMachineData = machines.find(m => m.id === selectedMachine)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📈 Efficiency Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor OEE, downtime and performance metrics</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('production.machine')}</label>
            <select
              value={selectedMachine || ''}
              onChange={(e) => setSelectedMachine(Number(e.target.value))}
              className="input"
            >
              <option value="">Select a machine</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </div>

      {selectedMachineData && efficiencyData && (
        <>
          {/* Machine Overview */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CogIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedMachineData.name}</h2>
                  <p className="text-gray-600">{selectedMachineData.code}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Period</div>
                <div className="font-medium">
                  {new Date(efficiencyData.period.start).toLocaleDateString()} - 
                  {new Date(efficiencyData.period.end).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">{efficiencyData.period.days} days</div>
              </div>
            </div>
          </div>

          {/* OEE Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Overall OEE */}
            <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Overall Equipment Effectiveness</p>
                  <p className={`text-3xl font-bold ${getEfficiencyColor(efficiencyData.efficiency.oee, 'oee')}`}>
                    {efficiencyData.efficiency.oee}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Target: 75%+
                  </p>
                </div>
                <ChartBarIcon className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            {/* Availability */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Availability</p>
                  <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyData.availability.availability_rate, 'availability')}`}>
                    {efficiencyData.availability.availability_rate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Runtime vs Planned
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Performance */}            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Performance</p>
                  <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyData.efficiency.performance_rate, 'oee')}`}>
                    {efficiencyData.efficiency.performance_rate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Speed Efficiency
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Quality */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('navigation.quality')}</p>
                  <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyData.production.quality_rate, 'quality')}`}>
                    {efficiencyData.production.quality_rate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Good Parts Rate
                  </p>
                </div>
                <BeakerIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Metrics */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Produced</span>
                  <span className="font-semibold text-gray-900">
                    {efficiencyData.production.total_produced.toLocaleString()} units
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Good Parts</span>
                  <span className="font-semibold text-green-600">
                    {efficiencyData.production.total_good.toLocaleString()} units
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Scrap Parts</span>
                  <span className="font-semibold text-red-600">
                    {efficiencyData.production.total_scrap.toLocaleString()} units
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Quality Rate</span>
                    <span className={`font-bold ${getEfficiencyColor(efficiencyData.production.quality_rate, 'quality')}`}>
                      {efficiencyData.production.quality_rate}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Scrap Rate</span>
                    <span className="font-semibold text-red-600">
                      {efficiencyData.production.scrap_rate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Metrics */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Time & Availability</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Theoretical Hours</span>
                  <span className="font-semibold text-gray-900">
                    {efficiencyData.availability.theoretical_hours.toFixed(1)}h
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Actual Runtime</span>
                  <span className="font-semibold text-green-600">
                    {efficiencyData.availability.actual_runtime_hours.toFixed(1)}h
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Downtime</span>
                  <span className="font-semibold text-red-600">
                    {efficiencyData.availability.total_downtime_hours.toFixed(1)}h
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Availability Rate</span>
                    <span className={`font-bold ${getEfficiencyColor(efficiencyData.availability.availability_rate, 'availability')}`}>
                      {efficiencyData.availability.availability_rate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OEE Breakdown Chart Placeholder */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">OEE Components Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {efficiencyData.availability.availability_rate}%
                </div>
                <div className="text-sm text-gray-600">Availability</div>
                <div className="text-xs text-gray-500">
                  = Runtime / Planned Time
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {efficiencyData.efficiency.performance_rate}%
                </div>
                <div className="text-sm text-gray-600">Performance</div>
                <div className="text-xs text-gray-500">
                  = Actual Rate / Ideal Rate
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {efficiencyData.production.quality_rate}%
                </div>
                <div className="text-sm text-gray-600">{t('navigation.quality')}</div>
                <div className="text-xs text-gray-500">
                  = Good Parts / Total Parts
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-600 mb-2">OEE = Availability × Performance × Quality</p>
              <p className="text-2xl font-bold text-gray-900">
                {efficiencyData.availability.availability_rate}% × {efficiencyData.efficiency.performance_rate}% × {efficiencyData.production.quality_rate}% = 
                <span className={`ml-2 ${getEfficiencyColor(efficiencyData.efficiency.oee, 'oee')}`}>
                  {efficiencyData.efficiency.oee}%
                </span>
              </p>
            </div>
          </div>

          {/* Action Items */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {efficiencyData.availability.availability_rate < 85 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Improve Availability</h4>
                  <p className="text-sm text-red-700">
                    High downtime detected. Consider preventive maintenance scheduling.
                  </p>
                </div>
              )}
              
              {efficiencyData.efficiency.performance_rate < 75 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Boost Performance</h4>
                  <p className="text-sm text-yellow-700">
                    Machine running below optimal speed. Check for bottlenecks.
                  </p>
                </div>
              )}
              
              {efficiencyData.production.quality_rate < 95 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Enhance Quality</h4>
                  <p className="text-sm text-orange-700">
                    High scrap rate. Review process parameters and operator training.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Loading State */}
      {loadingEfficiency && (
        <div className="card p-12 text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading efficiency data...</p>
        </div>
      )}

      {/* Empty State */}
      {!selectedMachine && !loading && (
        <div className="card p-12 text-center">
          <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a machine to view efficiency metrics</h3>
          <p className="text-gray-500">
            Choose a machine from the dropdown above to see detailed OEE, availability, performance, and quality data.
          </p>
        </div>
      )}
    </div>
  )
}

export default EfficiencyTracking
