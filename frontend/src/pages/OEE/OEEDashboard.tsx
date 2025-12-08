import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetOEERecordsQuery } from '../../services/api'
import { format } from 'date-fns'

export default function OEEDashboard() {
  const { t } = useLanguage();
const { data, isLoading } = useGetOEERecordsQuery({})

  const avgOEE = data?.records?.reduce((sum: number, r: any) => sum + r.oee, 0) / (data?.records?.length || 1) || 0
  const avgAvailability = data?.records?.reduce((sum: number, r: any) => sum + r.availability, 0) / (data?.records?.length || 1) || 0
  const avgPerformance = data?.records?.reduce((sum: number, r: any) => sum + r.performance, 0) / (data?.records?.length || 1) || 0
  const avgQuality = data?.records?.reduce((sum: number, r: any) => sum + r.quality, 0) / (data?.records?.length || 1) || 0

  const getOEEColor = (oee: number) => {
    if (oee >= 85) return 'text-green-600'
    if (oee >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('oee.dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Average OEE</h3>
          <p className={`mt-2 text-3xl font-semibold ${getOEEColor(avgOEE)}`}>
            {avgOEE.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Target: 85%</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Availability</h3>
          <p className={`mt-2 text-3xl font-semibold ${getOEEColor(avgAvailability)}`}>
            {avgAvailability.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Target: 90%</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Performance</h3>
          <p className={`mt-2 text-3xl font-semibold ${getOEEColor(avgPerformance)}`}>
            {avgPerformance.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Target: 95%</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">{t('navigation.quality')}</h3>
          <p className={`mt-2 text-3xl font-semibold ${getOEEColor(avgQuality)}`}>
            {avgQuality.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Target: 99%</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Record Number</th>
                  <th>{t('production.machine')}</th>
                  <th>{t('common.date')}</th>
                  <th>{t('production.shift')}</th>
                  <th>Availability</th>
                  <th>Performance</th>
                  <th>{t('navigation.quality')}</th>
                  <th>OEE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.records?.map((record: any) => (
                  <tr key={record.id}>
                    <td className="font-medium">{record.record_number}</td>
                    <td>{record.machine_name}</td>
                    <td>{format(new Date(record.record_date), 'dd MMM yyyy')}</td>
                    <td>{record.shift || '-'}</td>
                    <td className={getOEEColor(record.availability)}>{record.availability.toFixed(1)}%</td>
                    <td className={getOEEColor(record.performance)}>{record.performance.toFixed(1)}%</td>
                    <td className={getOEEColor(record.quality)}>{record.quality.toFixed(1)}%</td>
                    <td className={`font-semibold ${getOEEColor(record.oee)}`}>{record.oee.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
