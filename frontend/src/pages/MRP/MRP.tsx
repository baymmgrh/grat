import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetMRPMaterialsQuery, useGetMRPBOMsQuery, useGetMRPRequirementsQuery, useGetMRPForecastsQuery } from '../../services/api';
import {
  BeakerIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon

} from '@heroicons/react/24/outline';

const MRP: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('');
  const [daysAhead, setDaysAhead] = useState<number>(30);
  const [includeForecast, setIncludeForecast] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('requirements');

  const { data: materialsData, isLoading: materialsLoading } = useGetMRPMaterialsQuery({
    material_type: selectedMaterialType || undefined
  });

  const { data: bomsData, isLoading: bomsLoading } = useGetMRPBOMsQuery({});
  const { data: requirementsData, isLoading: requirementsLoading } = useGetMRPRequirementsQuery({
    days_ahead: daysAhead,
    include_forecasts: includeForecast
  });

  const { data: forecastsData, isLoading: forecastsLoading } = useGetMRPForecastsQuery({
    status: 'approved'
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Material Requirements Planning (MRP)</h1>
          <p className="text-gray-600">Integrated planning based on Sales Orders & Forecasts</p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeForecast}
              onChange={(e) => setIncludeForecast(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Include Forecasts</span>
          </label>
          <select
            className="border rounded px-3 py-2"
            value={daysAhead}
            onChange={(e) => setDaysAhead(parseInt(e.target.value))}
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requirements</p>
              <p className="text-2xl font-bold text-gray-900">
                {requirementsData?.requirements?.length || 0}
              </p>
            </div>
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {requirementsData?.settings?.confirmed_orders || 0}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Forecasts</p>
              <p className="text-2xl font-bold text-gray-900">
                {requirementsData?.settings?.forecasts_included || 0}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Shortages</p>
              <p className="text-2xl font-bold text-gray-900">
                {requirementsData?.requirements?.filter((r: any) => r.net_requirement > 0).length || 0}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'requirements', name: 'Material Requirements', icon: ClipboardDocumentListIcon },
              { id: 'simulation', name: 'What-If Simulation', icon: BeakerIcon },
              { id: 'forecasts', name: 'Sales Forecasts', icon: CalendarIcon },
              { id: 'materials', name: 'Materials', icon: CubeIcon },
              { id: 'boms', name: t('products.bom.title'), icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Material Requirements Analysis</h3>
              {requirementsLoading ? (
                <div className="text-center py-8">Loading requirements...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('products.bom.material')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmed Demand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forecast Demand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Required</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Requirement</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requirementsData?.requirements?.map((req: any) => (
                        <tr key={req.material_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{req.material_name}</div>
                              <div className="text-sm text-gray-500">{req.material_code}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {req.current_stock?.toFixed(2)} {req.uom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {req.confirmed_quantity?.toFixed(2)} {req.uom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {req.forecast_quantity?.toFixed(2)} {req.uom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {req.total_quantity?.toFixed(2)} {req.uom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {req.net_requirement?.toFixed(2)} {req.uom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {req.net_requirement > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <BeakerIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">What-If Simulation</h3>
                <p className="text-gray-600 mb-6">
                  Compare different planning scenarios and analyze their impact on material requirements
                </p>
                <button
                  onClick={() => {
                    console.log('Navigating to simulation...');
                    navigate('/app/mrp/simulation');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <BeakerIcon className="h-5 w-5 mr-2" />
                  Launch Simulation Tool
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-3">
                    <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    <h4 className="text-lg font-semibold text-purple-900 ml-2">Scenario Planning</h4>
                  </div>
                  <p className="text-purple-700 text-sm">
                    Create multiple scenarios with different demand levels, forecast confidence, and planning parameters
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <ExclamationTriangleIcon className="h-8 w-8 text-blue-600" />
                    <h4 className="text-lg font-semibold text-blue-900 ml-2">Risk Analysis</h4>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Compare best-case, worst-case, and most-likely scenarios to understand planning risks
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center mb-3">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    <h4 className="text-lg font-semibold text-green-900 ml-2">Optimization</h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Identify the optimal planning approach based on material availability and demand patterns
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forecasts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sales Forecasts Integration</h3>
              {forecastsLoading ? (
                <div className="text-center py-8">Loading forecasts...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forecast</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('production.product')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Most Likely</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {forecastsData?.forecasts?.map((forecast: any) => (
                        <tr key={forecast.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{forecast.name}</div>
                              <div className="text-sm text-gray-500">{forecast.forecast_number}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {forecast.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {forecast.period_start} to {forecast.period_end}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {forecast.most_likely?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${forecast.confidence_level === 'high' ? 'bg-green-100 text-green-800' : forecast.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {forecast.confidence_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Materials Master</h3>
                <select
                  className="border rounded px-3 py-1"
                  value={selectedMaterialType}
                  onChange={(e) => setSelectedMaterialType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="raw_material">Raw Materials</option>
                  <option value="semi_finished">Semi-Finished</option>
                  <option value="finished_goods">Finished Goods</option>
                </select>
              </div>
              {materialsLoading ? (
                <div className="text-center py-8">Loading materials...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materialsData?.materials?.map((material: any) => (
                    <div key={material.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                      <p className="text-sm text-gray-500">{material.code}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Type:</span>
                          <span className="font-medium">{material.material_type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Current Stock:</span>
                          <span className="font-medium">{material.current_stock} {material.primary_uom}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Min Level:</span>
                          <span className="font-medium">{material.min_stock_level} {material.primary_uom}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'boms' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('products.bom.title')}</h3>
              {bomsLoading ? (
                <div className="text-center py-8">Loading BOMs...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bomsData?.boms?.map((bom: any) => (
                    <div key={bom.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{bom.product_name}</h4>
                      <p className="text-sm text-gray-500">{bom.bom_number}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Version:</span>
                          <span className="font-medium">{bom.version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Batch Size:</span>
                          <span className="font-medium">{bom.batch_size} {bom.batch_uom}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Items:</span>
                          <span className="font-medium">{bom.item_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MRP;
