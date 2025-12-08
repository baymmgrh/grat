import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
interface RosterData {
  type: string;
  timestamp: string;
  date: string;
  roster_data: {
    date: string;
    machines: Record<string, {
      machine_id: number;
      machine_code: string;
      machine_name: string;
      machine_type: string;
      status: string;
      shifts: Record<string, {
        shift_id: number;
        shift_name: string;
        start_time: string;
        end_time: string;
        assigned_employees: Array<{
          employee_id: number;
          employee_name: string;
          employee_number: string;
          department: string | null;
        }>;
      }>;
    }>;
  };
  summary: {
    total_machines: number;
    total_assignments: number;
    machines_with_assignments: number;
  };
}

const TVDisplayRoster: React.FC = () => {
  const { t } = useLanguage();

  const [data, setData] = useState<RosterData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/tv-display/roster');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch roster data', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const getCurrentShift = () => {
    // For now, return a mock current shift since backend doesn't provide this info
    return {
      name: 'Shift 1',
      start_time: '07:00',
      end_time: '15:00'
    };
  };

  const getMachineStatus = (status: string) => {
    switch (status) {
      case 'running':
        return { color: 'bg-green-500', label: 'RUNNING' };
      case 'stopped':
        return { color: 'bg-red-500', label: 'STOPPED' };
      case 'maintenance':
        return { color: 'bg-yellow-500', label: 'MAINTENANCE' };
      default:
        return { color: 'bg-gray-500', label: 'UNKNOWN' };
    }
  };


  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading Roster Data...</p>
        </div>
      </div>
    );
  }

  const currentShift = getCurrentShift();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Employee Roster - Production Floor</h1>
            <p className="text-xl text-gray-400">Employee Roster</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">
              {currentTime.toLocaleTimeString('id-ID')}
            </div>
            <div className="text-lg text-gray-400">
              {currentTime.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            {currentShift && (
              <div className="mt-2 px-4 py-2 bg-blue-600 rounded-lg">
                <span className="font-semibold">Shift: {currentShift.name}</span>
                <br />
                <span className="text-sm">{currentShift.start_time} - {currentShift.end_time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Shift Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Total Machines</h3>
            <p className="text-4xl font-bold">{data.summary?.total_machines || 0}</p>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">With Assignments</h3>
            <p className="text-4xl font-bold">
              {data.summary?.machines_with_assignments || 0}
            </p>
          </div>
          <div className="bg-purple-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Total Assignments</h3>
            <p className="text-4xl font-bold">
              {data.summary?.total_assignments || 0}
            </p>
          </div>
          <div className="bg-yellow-600 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Unassigned</h3>
            <p className="text-4xl font-bold">
              {(data.summary?.total_machines || 0) - (data.summary?.machines_with_assignments || 0)}
            </p>
          </div>
        </div>

        {/* Machine Status Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Machine Status & Assignments</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-4 font-semibold">{t('production.machine')}</th>
                  <th className="py-4 px-4 font-semibold">{t('common.status')}</th>
                  <th className="py-4 px-4 font-semibold">Type</th>
                  <th className="py-4 px-4 font-semibold">Current Assignments</th>
                </tr>
              </thead>
              <tbody>
                {data.roster_data?.machines && Object.values(data.roster_data.machines).map(machine => {
                  const statusInfo = getMachineStatus(machine.status);
                  const totalAssignments = Object.values(machine.shifts || {}).reduce((total, shift) => 
                    total + (shift.assigned_employees?.length || 0), 0
                  );
                  
                  return (
                    <tr key={machine.machine_id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold text-lg">{machine.machine_code}</div>
                          <div className="text-sm text-gray-400">{machine.machine_name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} text-white`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-300 capitalize">
                          {machine.machine_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {totalAssignments > 0 ? (
                          <div className="space-y-2">
                            {Object.values(machine.shifts || {}).map(shift => 
                              shift.assigned_employees?.map(employee => (
                                <div key={`${shift.shift_id}-${employee.employee_id}`} className="bg-gray-700 rounded-lg p-2">
                                  <div className="font-medium text-sm text-white">{employee.employee_name}</div>
                                  <div className="text-xs text-gray-400">
                                    {shift.shift_name} ({shift.start_time} - {shift.end_time})
                                  </div>
                                  {employee.department && (
                                    <div className="text-xs text-blue-400">{employee.department}</div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <div className="bg-red-900 bg-opacity-30 rounded-lg p-2 text-center">
                            <span className="text-red-400 text-sm">No Assignments</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center">
          <div className="bg-gray-800 rounded-lg p-4 flex space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm">Running</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-sm">Stopped</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm">{t('navigation.maintenance')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-700 rounded mr-2"></div>
              <span className="text-sm">Has Assignment</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-900 bg-opacity-30 rounded mr-2"></div>
              <span className="text-sm">No Assignment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVDisplayRoster;
