import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios'

export default function TVDisplayProduction() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/tv-display/production')
        setData(response.data)
      } catch (error) {
        console.error('Failed to fetch data', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
    }
  }, [])

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num)

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-white text-xl">Loading Production Data...</p>
      </div>
    </div>
  )

  const runningMachines = data.machines?.filter((m: any) => m.status === 'running').length || 0
  const totalMachines = data.machines?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              🏭 Production Floor Monitor
            </h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-cyan-400">
              {currentTime.toLocaleTimeString('id-ID')}
            </p>
            <p className="text-sm text-gray-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl border border-blue-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm uppercase tracking-wider">Produksi Hari Ini</p>
                <p className="text-4xl font-bold mt-2">{formatNumber(data.today_production || 0)}</p>
                <p className="text-blue-300 text-sm mt-1">pcs</p>
              </div>
              <div className="text-6xl opacity-30">📦</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-xl border border-green-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm uppercase tracking-wider">Work Order Aktif</p>
                <p className="text-4xl font-bold mt-2">{data.active_work_orders?.length || 0}</p>
                <p className="text-green-300 text-sm mt-1">sedang berjalan</p>
              </div>
              <div className="text-6xl opacity-30">📋</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-xl border border-purple-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm uppercase tracking-wider">Mesin Running</p>
                <p className="text-4xl font-bold mt-2">{runningMachines} / {totalMachines}</p>
                <p className="text-purple-300 text-sm mt-1">mesin aktif</p>
              </div>
              <div className="text-6xl opacity-30">⚙️</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 rounded-2xl shadow-xl border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-200 text-sm uppercase tracking-wider">Quality Rate</p>
                <p className="text-4xl font-bold mt-2">{data.quality_rate?.toFixed(1) || 96}%</p>
                <p className="text-cyan-300 text-sm mt-1">good products</p>
              </div>
              <div className="text-6xl opacity-30">✅</div>
            </div>
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/50 to-purple-600/50 px-6 py-4 border-b border-white/10">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="animate-pulse">🔄</span> Work Order Aktif
            </h2>
          </div>
          
          <div className="p-4 space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
            {data.active_work_orders?.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-6xl mb-4">📭</p>
                <p className="text-xl">Tidak ada Work Order aktif saat ini</p>
              </div>
            ) : (
              data.active_work_orders?.map((wo: any, index: number) => (
                <div key={wo.wo_number} 
                  className={`bg-gradient-to-r ${index % 2 === 0 ? 'from-slate-800/80 to-slate-700/80' : 'from-slate-700/80 to-slate-800/80'} 
                    p-5 rounded-xl border border-white/5 hover:border-blue-400/30 transition-all`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-xs px-3 py-1 rounded-full font-bold">{wo.wo_number}</span>
                        <span className="bg-green-600/50 text-xs px-2 py-1 rounded-full">
                          {wo.status === 'in_progress' ? '🔄 In Progress' : wo.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mt-2">{wo.product_name}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        🏭 {wo.machine || 'Belum ditentukan'} • 👤 {wo.operator || 'Operator'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${wo.progress >= 80 ? 'text-green-400' : wo.progress >= 50 ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {wo.progress?.toFixed(1) || 0}%
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {formatNumber(wo.quantity_produced || 0)} / {formatNumber(wo.quantity || 0)} pcs
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="bg-gray-700/50 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          wo.progress >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                          wo.progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                          'bg-gradient-to-r from-blue-500 to-cyan-400'
                        }`}
                        style={{ width: `${Math.min(wo.progress || 0, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-white/10 px-8 py-2">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <p>Auto-refresh setiap 10 detik</p>
          <p>PT. Gratia Makmur Sentosa - ERP System</p>
        </div>
      </div>
    </div>
  )
}
