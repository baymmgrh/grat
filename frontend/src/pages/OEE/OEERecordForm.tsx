import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMachinesQuery, useCreateOEERecordMutation, useCreateDowntimeRecordMutation } from '../../services/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon

} from '@heroicons/react/24/outline';
export default function OEERecordForm() {
  const { t } = useLanguage();
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    machine_id: '',
    work_order_id: '',
    record_date: new Date().toISOString().split('T')[0],
    shift: '',
    planned_production_time: '',
    downtime: '',
    actual_production_time: '',
    ideal_cycle_time: '',
    total_pieces_produced: '',
    good_pieces: '',
    rejected_pieces: '',
    notes: ''
  })
  
  const [downtimeRecords, setDowntimeRecords] = useState([{
    downtime_category: '',
    reason: '',
    duration_minutes: '',
    start_time: '',
    end_time: ''
  }])
  
  const { data: machinesData } = useGetMachinesQuery({})
  const [createOEERecord, { isLoading: isCreating }] = useCreateOEERecordMutation()
  const [createDowntimeRecord] = useCreateDowntimeRecordMutation()
  
  const machines = machinesData?.machines || []
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleDowntimeChange = (index: number, field: string, value: string) => {
    setDowntimeRecords(prev => prev.map((record, i) => 
      i === index ? { ...record, [field]: value } : record
    ))
  }
  
  const addDowntimeRecord = () => {
    setDowntimeRecords(prev => [...prev, {
      downtime_category: '',
      reason: '',
      duration_minutes: '',
      start_time: '',
      end_time: ''
    }])
  }
  
  const removeDowntimeRecord = (index: number) => {
    setDowntimeRecords(prev => prev.filter((_, i) => i !== index))
  }
  
  const calculateMetrics = () => {
    const plannedTime = parseFloat(formData.planned_production_time) || 0
    const downtime = parseFloat(formData.downtime) || 0
    const actualTime = parseFloat(formData.actual_production_time) || 0
    const idealCycle = parseFloat(formData.ideal_cycle_time) || 0
    const totalPieces = parseFloat(formData.total_pieces_produced) || 0
    const goodPieces = parseFloat(formData.good_pieces) || 0
    
    const availability = plannedTime > 0 ? ((plannedTime - downtime) / plannedTime) * 100 : 0
    const performance = actualTime > 0 && idealCycle > 0 ? ((totalPieces * idealCycle) / (actualTime * 60)) * 100 : 0
    const quality = totalPieces > 0 ? (goodPieces / totalPieces) * 100 : 0
    const oee = (availability * performance * quality) / 10000
    
    return {
      availability: availability.toFixed(1),
      performance: performance.toFixed(1),
      quality: quality.toFixed(1),
      oee: oee.toFixed(1)
    }
  }
  
  const metrics = calculateMetrics()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validate required fields
      if (!formData.machine_id || !formData.record_date || !formData.planned_production_time) {
        toast.error('Please fill in all required fields')
        return
      }
      
      // Create OEE record
      const oeeData = {
        ...formData,
        planned_production_time: parseInt(formData.planned_production_time),
        downtime: parseInt(formData.downtime) || 0,
        actual_production_time: parseInt(formData.actual_production_time) || 0,
        ideal_cycle_time: parseFloat(formData.ideal_cycle_time) || 0,
        total_pieces_produced: parseInt(formData.total_pieces_produced) || 0,
        good_pieces: parseInt(formData.good_pieces) || 0,
        rejected_pieces: parseInt(formData.rejected_pieces) || 0,
        machine_id: parseInt(formData.machine_id),
        work_order_id: formData.work_order_id ? parseInt(formData.work_order_id) : null
      }
      
      const result = await createOEERecord(oeeData).unwrap()
      
      // Create downtime records if any
      for (const downtime of downtimeRecords) {
        if (downtime.downtime_category && downtime.duration_minutes) {
          await createDowntimeRecord({
            oee_record_id: result.record_id,
            machine_id: parseInt(formData.machine_id),
            downtime_category: downtime.downtime_category,
            reason: downtime.reason,
            duration_minutes: parseInt(downtime.duration_minutes),
            start_time: downtime.start_time ? new Date(downtime.start_time).toISOString() : new Date().toISOString(),
            end_time: downtime.end_time ? new Date(downtime.end_time).toISOString() : null
          })
        }
      }
      
      toast.success('OEE record created successfully')
      navigate('/app/oee')
      
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create OEE record')
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/oee')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create OEE Record</h1>
          <p className="text-gray-600">Record Overall Equipment Effectiveness data</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine *
                  </label>
                  <select
                    name="machine_id"
                    value={formData.machine_id}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="">Select Machine</option>
                    {machines.map((machine: any) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name} ({machine.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Order ID
                  </label>
                  <input
                    type="number"
                    name="work_order_id"
                    value={formData.work_order_id}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Record Date *
                  </label>
                  <input
                    type="date"
                    name="record_date"
                    value={formData.record_date}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('production.shift')}</label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Select Shift</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Time Metrics */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Time Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Production Time (minutes) *
                  </label>
                  <input
                    type="number"
                    name="planned_production_time"
                    value={formData.planned_production_time}
                    onChange={handleInputChange}
                    className="input"
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Downtime (minutes)
                  </label>
                  <input
                    type="number"
                    name="downtime"
                    value={formData.downtime}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Production Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="actual_production_time"
                    value={formData.actual_production_time}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Production Metrics */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CogIcon className="h-5 w-5" />
                Production Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ideal Cycle Time (seconds per unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="ideal_cycle_time"
                    value={formData.ideal_cycle_time}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Pieces Produced
                  </label>
                  <input
                    type="number"
                    name="total_pieces_produced"
                    value={formData.total_pieces_produced}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Good Pieces
                  </label>
                  <input
                    type="number"
                    name="good_pieces"
                    value={formData.good_pieces}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejected Pieces
                  </label>
                  <input
                    type="number"
                    name="rejected_pieces"
                    value={formData.rejected_pieces}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Downtime Records */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Downtime Records
                </h3>
                <button
                  type="button"
                  onClick={addDowntimeRecord}
                  className="btn-secondary"
                >
                  Add Downtime
                </button>
              </div>
              
              <div className="space-y-4">
                {downtimeRecords.map((record, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Downtime #{index + 1}</h4>
                      {downtimeRecords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDowntimeRecord(index)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('products.bom.category')}</label>
                        <select
                          value={record.downtime_category}
                          onChange={(e) => handleDowntimeChange(index, 'downtime_category', e.target.value)}
                          className="input text-sm"
                        >
                          <option value="">Select Category</option>
                          <option value="breakdown">Breakdown</option>
                          <option value="changeover">Changeover</option>
                          <option value="setup">Setup</option>
                          <option value="planned_maintenance">Planned Maintenance</option>
                          <option value="no_material">No Material</option>
                          <option value="no_operator">No Operator</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={record.duration_minutes}
                          onChange={(e) => handleDowntimeChange(index, 'duration_minutes', e.target.value)}
                          className="input text-sm"
                          min="0"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                        </label>
                        <input
                          type="text"
                          value={record.reason}
                          onChange={(e) => handleDowntimeChange(index, 'reason', e.target.value)}
                          className="input text-sm"
                          placeholder="Describe the reason for downtime"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Additional notes or observations..."
              />
            </div>
          </div>
          
          {/* Sidebar - Calculated Metrics */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                Calculated OEE
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Availability</span>
                  <span className="text-lg font-semibold text-blue-600">{metrics.availability}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span className="text-lg font-semibold text-green-600">{metrics.performance}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('navigation.quality')}</span>
                  <span className="text-lg font-semibold text-purple-600">{metrics.quality}%</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-gray-900">Overall OEE</span>
                  <span className={`text-2xl font-bold ${
                    parseFloat(metrics.oee) >= 85 ? 'text-green-600' :
                    parseFloat(metrics.oee) >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {metrics.oee}%
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">OEE Targets</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• World Class: ≥85%</div>
                  <div>• Good: 70-84%</div>
                  <div>• Needs Improvement: &lt;70%</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full"
              >
                {isCreating ? 'Creating...' : 'Create OEE Record'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/app/oee')}
                className="btn-secondary w-full"
              >{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
