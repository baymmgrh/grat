import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useGetRosterQuery } from '../../services/api'
import { format, startOfWeek, addDays } from 'date-fns'
import {
  CursorArrowRaysIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
export default function RosterCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  
  const { data, isLoading } = useGetRosterQuery({
    start_date: format(weekStart, 'yyyy-MM-dd'),
    end_date: format(addDays(weekStart, 6), 'yyyy-MM-dd')
  })

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getShiftColor = (shift: string) => {
    const colors: Record<string, string> = {
      'Shift 1': 'bg-blue-100 text-blue-800 border-blue-300',
      'Shift 2': 'bg-green-100 text-green-800 border-green-300',
      'Shift 3': 'bg-purple-100 text-purple-800 border-purple-300'
    }
    return colors[shift] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Roster</h1>
          <p className="text-gray-600">View and manage employee shift schedules</p>
        </div>
        <div className="flex gap-2">
          <Link 
            to="/app/hr/roster/manage"
            className="btn-primary inline-flex items-center gap-2"
          >
            <CursorArrowRaysIcon className="h-5 w-5" />
            Drag & Drop Roster
          </Link>
          <button 
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="btn-secondary"
          >
            Previous Week
          </button>
          <button 
            onClick={() => setCurrentWeek(new Date())}
            className="btn-secondary"
          >
            This Week
          </button>
          <button 
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="btn-secondary"
          >
            Next Week
          </button>
        </div>
      </div>

      {/* Drag & Drop Feature Highlight */}
      <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CursorArrowRaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Interactive Roster Management</h3>
              <p className="text-sm text-blue-700">Use drag & drop to easily assign employees to machines and shifts</p>
            </div>
          </div>
          <Link 
            to="/app/hr/roster/manage"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <CursorArrowRaysIcon className="h-4 w-4" />
            Try Drag & Drop
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-4">
          Week of {format(weekStart, 'dd MMM yyyy')}
        </h3>
        
        {isLoading ? (
          <div className="text-center py-12">Loading roster...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  </th>
                  {weekDays.map((day) => (
                    <th key={day.toString()} className="px-4 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>{format(day, 'EEE')}</div>
                      <div className="font-normal">{format(day, 'dd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.rosters?.reduce((acc: any[], roster: any) => {
                  if (!acc.find((e: any) => e.employee_id === roster.employee_id)) {
                    acc.push({
                      employee_id: roster.employee_id,
                      employee_name: roster.employee_name
                    })
                  }
                  return acc
                }, []).map((employee: any) => (
                  <tr key={employee.employee_id}>
                    <td className="px-4 py-2 font-medium text-sm">{employee.employee_name}</td>
                    {weekDays.map((day) => {
                      const dayRoster = data?.rosters?.find((r: any) => 
                        r.employee_id === employee.employee_id && 
                        format(new Date(r.roster_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      )
                      return (
                        <td key={day.toString()} className="px-2 py-2 text-center">
                          {dayRoster ? (
                            dayRoster.is_off_day ? (
                              <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                              </span>
                            ) : (
                              <span className={`inline-block px-3 py-1 text-xs rounded-full border ${getShiftColor(dayRoster.shift_name)}`}>
                                {dayRoster.shift_name}
                              </span>
                            )
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
            <span>Shift 1 (Pagi)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span>Shift 2 (Siang)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
            <span>Shift 3 (Malam)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200"></div>
            <span>Off Day</span>
          </div>
        </div>
      </div>
    </div>
  )
}
