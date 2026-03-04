import React, { useState } from 'react'
import { useRunMRPSimulationMutation, useGetSimulationTemplatesQuery } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'
import {
  ArrowsRightLeftIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon

} from '@heroicons/react/24/outline';

interface Scenario {
  name: string
  include_forecasts: boolean
  forecast_confidence: 'best_case' | 'most_likely' | 'worst_case'
  demand_multiplier: number
}

interface SimulationResult {
  scenario_name: string
  scenario_config: Scenario & { days_ahead: number }
  summary: {
    total_materials: number
    critical_materials: number
    total_shortage_value: number
    confirmed_orders_count: number
    forecasts_included: number
  }
  requirements: any[]
}

export default function WhatIfSimulation() {
  const { t } = useLanguage();

  console.log('WhatIfSimulation component loaded successfully!');
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [daysAhead, setDaysAhead] = useState(30)
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customScenario, setCustomScenario] = useState<Scenario>({
    name: '',
    include_forecasts: true,
    forecast_confidence: 'most_likely',
    demand_multiplier: 1.0
  })

  const { data: templatesData } = useGetSimulationTemplatesQuery({})
  const [runSimulation] = useRunMRPSimulationMutation()

  const addScenario = (scenario: Scenario) => {
    console.log('Adding scenario:', scenario);
    
    if (!scenario.name.trim()) {
      toast.error('Scenario name is required')
      return
    }
    
    if (scenarios.find(s => s.name === scenario.name)) {
      toast.error('Scenario name must be unique')
      return
    }

    const newScenarios = [...scenarios, scenario];
    setScenarios(newScenarios);
    console.log('Scenarios after add:', newScenarios);
    
    setCustomScenario({
      name: '',
      include_forecasts: true,
      forecast_confidence: 'most_likely',
      demand_multiplier: 1.0
    })
    toast.success('Scenario added')
  }

  const removeScenario = (index: number) => {
    setScenarios(scenarios.filter((_, i) => i !== index))
  }

  const addTemplateScenario = (templateId: string) => {
    const template = templatesData?.templates?.find((t: any) => t.id === templateId)
    if (template) {
      const scenario: Scenario = {
        name: template.name,
        ...template.config
      }
      addScenario(scenario)
      setSelectedTemplate('')
    }
  }

  const runWhatIfSimulation = async () => {
    console.log('Run simulation clicked. Scenarios:', scenarios.length);
    
    if (scenarios.length === 0) {
      toast.error('Add at least one scenario to run simulation')
      return
    }

    setIsRunning(true)
    try {
      console.log('Sending simulation request:', { days_ahead: daysAhead, scenarios });
      
      const result = await runSimulation({
        days_ahead: daysAhead,
        scenarios: scenarios
      }).unwrap()

      console.log('Simulation result:', result);
      setSimulationResults(result.simulation_results)
      toast.success(`Simulation completed with ${result.scenarios_count} scenarios`)
    } catch (error: any) {
      console.error('Simulation error:', error);
      toast.error(error?.data?.message || 'Simulation failed')
    } finally {
      setIsRunning(false)
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    const badges: Record<string, string> = {
      'best_case': 'badge-green',
      'most_likely': 'badge-blue',
      'worst_case': 'badge-red'
    }
    return badges[confidence] || 'badge-gray'
  }

  const getRiskLevel = (criticalMaterials: number) => {
    if (criticalMaterials < 5) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' }
    if (criticalMaterials < 15) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BeakerIcon className="h-8 w-8 text-purple-600" />
            MRP What-If Simulation
          </h1>
          <p className="text-gray-600">Compare different planning scenarios and their impact on material requirements</p>
        </div>
        <button
          onClick={runWhatIfSimulation}
          disabled={isRunning || scenarios.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <PlayIcon className="h-5 w-5" />
          {isRunning ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Planning Period */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Planning Period
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Ahead
              </label>
              <input
                type="number"
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Planning horizon: {daysAhead} days from today
              </p>
            </div>
          </div>

          {/* Template Scenarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Templates
            </h3>
            <div className="space-y-2">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a template...</option>
                {templatesData?.templates?.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <p className="font-medium">
                    {templatesData?.templates?.find((t: any) => t.id === selectedTemplate)?.name}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {templatesData?.templates?.find((t: any) => t.id === selectedTemplate)?.description}
                  </p>
                  <button
                    onClick={() => addTemplateScenario(selectedTemplate)}
                    className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors mt-2"
                  >
                    Add Template
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Custom Scenario */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Custom Scenario
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={customScenario.name}
                  onChange={(e) => setCustomScenario({...customScenario, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Custom Scenario"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customScenario.include_forecasts}
                    onChange={(e) => setCustomScenario({...customScenario, include_forecasts: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">Include Forecasts</span>
                </label>
              </div>

              {customScenario.include_forecasts && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forecast Confidence
                  </label>
                  <select
                    value={customScenario.forecast_confidence}
                    onChange={(e) => setCustomScenario({...customScenario, forecast_confidence: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="best_case">Best Case (Optimistic)</option>
                    <option value="most_likely">Most Likely (Realistic)</option>
                    <option value="worst_case">Worst Case (Conservative)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Demand Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customScenario.demand_multiplier}
                  onChange={(e) => setCustomScenario({...customScenario, demand_multiplier: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customScenario.demand_multiplier > 1 ? 
                    `${((customScenario.demand_multiplier - 1) * 100).toFixed(0)}% increase` :
                    customScenario.demand_multiplier < 1 ?
                    `${((1 - customScenario.demand_multiplier) * 100).toFixed(0)}% decrease` :
                    'No change'
                  }
                </p>
              </div>

              <button
                onClick={() => addScenario(customScenario)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Add Scenario
              </button>
            </div>
          </div>

          {/* Current Scenarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Scenarios ({scenarios.length})
            </h3>
            <div className="space-y-2">
              {scenarios.map((scenario, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{scenario.name}</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Forecasts: {scenario.include_forecasts ? 'Yes' : 'No'}</div>
                      {scenario.include_forecasts && (
                        <div>Confidence: <span className={`badge ${getConfidenceBadge(scenario.forecast_confidence)} text-xs`}>
                          {scenario.forecast_confidence.replace('_', ' ')}
                        </span></div>
                      )}
                      <div>Demand: {(scenario.demand_multiplier * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeScenario(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              {scenarios.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No scenarios added yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Simulation Results */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResults.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Simulation Results Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {simulationResults.map((result, index) => {
                    const risk = getRiskLevel(result.summary.critical_materials)
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{result.scenario_name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${risk.bg} ${risk.color}`}>
                            {risk.level} Risk
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Materials:</span>
                            <span className="font-medium">{result.summary.total_materials}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Critical Materials:</span>
                            <span className={`font-medium ${result.summary.critical_materials > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {result.summary.critical_materials}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Orders:</span>
                            <span className="font-medium">{result.summary.confirmed_orders_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Forecasts:</span>
                            <span className="font-medium">{result.summary.forecasts_included}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Detailed Comparison */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ArrowsRightLeftIcon className="h-5 w-5" />
                  Scenario Comparison
                </h3>
                
                {/* Material Requirements Comparison */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.bom.material')}</th>
                        {simulationResults.map((result, index) => (
                          <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {result.scenario_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Get unique materials across all scenarios */}
                      {Array.from(new Set(
                        simulationResults.flatMap(result => 
                          result.requirements.map(req => req.material_id)
                        )
                      )).slice(0, 10).map((materialId) => {
                        const materialInfo = simulationResults[0].requirements.find(req => req.material_id === materialId)
                        return (
                          <tr key={materialId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {materialInfo?.material_code}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {materialInfo?.material_name}
                                </div>
                              </div>
                            </td>
                            {simulationResults.map((result, index) => {
                              const req = result.requirements.find(r => r.material_id === materialId)
                              return (
                                <td key={index} className="px-6 py-4 whitespace-nowrap">
                                  {req ? (
                                    <div className="text-sm">
                                      <div className={`font-medium ${req.net_requirement > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {req.net_requirement > 0 ? 
                                          `Shortage: ${req.net_requirement.toFixed(2)}` :
                                          'Sufficient'
                                        }
                                      </div>
                                      <div className="text-gray-500">
                                        Need: {req.total_quantity.toFixed(2)} {req.uom}
                                      </div>
                                      <div className="text-gray-500">
                                        Stock: {req.current_stock.toFixed(2)} {req.uom}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights & Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Insights & Recommendations
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Best Case Scenario */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Best Case Scenario</h4>
                    </div>
                    {(() => {
                      const bestScenario = simulationResults.reduce((best, current) => 
                        current.summary.critical_materials < best.summary.critical_materials ? current : best
                      )
                      return (
                        <div className="text-sm text-green-800">
                          <p className="font-medium">{bestScenario.scenario_name}</p>
                          <p>Only {bestScenario.summary.critical_materials} critical materials</p>
                          <p>Risk Level: {getRiskLevel(bestScenario.summary.critical_materials).level}</p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Worst Case Scenario */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">Highest Risk Scenario</h4>
                    </div>
                    {(() => {
                      const worstScenario = simulationResults.reduce((worst, current) => 
                        current.summary.critical_materials > worst.summary.critical_materials ? current : worst
                      )
                      return (
                        <div className="text-sm text-red-800">
                          <p className="font-medium">{worstScenario.scenario_name}</p>
                          <p>{worstScenario.summary.critical_materials} critical materials</p>
                          <p>Risk Level: {getRiskLevel(worstScenario.summary.critical_materials).level}</p>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Simulation Results</h3>
              <p className="text-gray-600 mb-4">
                Add scenarios and run simulation to see results and comparisons
              </p>
              <div className="text-sm text-gray-500">
                <p>• Add multiple scenarios to compare different planning approaches</p>
                <p>• Use templates for quick setup or create custom scenarios</p>
                <p>• Compare material requirements across scenarios</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
