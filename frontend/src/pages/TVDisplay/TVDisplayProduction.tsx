import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios'
export default function TVDisplayProduction() {
    const { t } = useLanguage();

const [data, setData] = useState<any>(null)

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
    const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">{t('common.loading')}</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Production Floor - Real-time Monitor</h1>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Today's Production</h3>
            <p className="text-4xl font-bold">{data.today_production}</p>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Active Work Orders</h3>
            <p className="text-4xl font-bold">{data.active_work_orders?.length || 0}</p>
          </div>
          <div className="bg-purple-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Machines Running</h3>
            <p className="text-4xl font-bold">{data.machines?.filter((m: any) => m.status === 'running').length || 0}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Active Work Orders</h2>
          {data.active_work_orders?.map((wo: any) => (
            <div key={wo.wo_number} className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{wo.wo_number}</h3>
                  <p className="text-gray-400">{wo.product_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{wo.progress.toFixed(1)}%</p>
                  <p className="text-sm text-gray-400">{wo.quantity_produced} / {wo.quantity}</p>
                </div>
              </div>
              <div className="mt-4 bg-gray-700 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${wo.progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-gray-400">Machine: {wo.machine || 'Not assigned'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
