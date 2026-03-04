import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  CogIcon,
  UserIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import axiosInstance from '../../utils/axiosConfig';
// Enhanced StrictMode Droppable with better error handling
const RobustDroppable = ({ children, ...props }: any) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};

interface Employee {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  position: string;
}

interface Machine {
  id: number;
  code: string;
  name: string;
  department: string;
  status: string;
}

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  color_code: string;
}

interface RosterAssignment {
  id: number;
  employee_id: number;
  machine_id: number;
  shift_id: number;
  date: string;
  employee?: Employee;
  machine?: Machine;
}

interface RosterData {
  employees: Employee[];
  machines: Machine[];
  shifts: Shift[];
  assignments: RosterAssignment[];
  week_dates: string[];
}

const RosterDragDropRobust: React.FC = () => {

  const [data, setData] = useState<RosterData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced date helper
  const getWeekDates = (startDate: Date): string[] => {
    const week = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date.toISOString().split('T')[0]);
    }
    return week;
  };

  // Enhanced data loading with better error handling
  const loadDataFromServer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading data from server...');
      
      // Load employees
      const employeeResponse = await axiosInstance.get('/api/hr/employees?active=true');
      console.log('👥 Employee response:', employeeResponse.data);
      
      // Load machines
      const machineResponse = await axiosInstance.get('/api/production/machines');
      console.log('🏭 Machine response:', machineResponse.data);
      
      // Load shifts
      const shiftResponse = await axiosInstance.get('/api/hr/shifts');
      console.log('⏰ Shift response:', shiftResponse.data);
      
      // Load roster data for the selected week
      const weekStart = getWeekDates(selectedWeek)[0];
      const weekEnd = getWeekDates(selectedWeek)[6];
      const rosterResponse = await axiosInstance.get(`/api/hr/roster?start_date=${weekStart}&end_date=${weekEnd}`);
      console.log('📊 Roster response:', rosterResponse.data);
      
      // Process employees
      const employees = (employeeResponse.data?.employees || []).map((emp: any) => ({
        id: emp.id,
        name: emp.full_name || emp.name || `Employee ${emp.id}`,
        employee_id: emp.employee_number || emp.employee_id || emp.id.toString(),
        department: emp.department?.name || 'Production',
        position: emp.position || 'Operator'
      }));
      
      // Process machines
      const machines = (machineResponse.data?.machines || []).map((machine: any) => ({
        id: machine.id,
        code: machine.code || `M${machine.id}`,
        name: machine.name || `Machine ${machine.id}`,
        department: machine.department || 'Production',
        status: machine.status || 'operational'
      }));
      
      // Process shifts
      const shifts = shiftResponse.data?.shifts || [
        { id: 1, name: 'Shift 1 (Pagi)', start_time: '07:00', end_time: '15:00', color_code: '#3B82F6' },
        { id: 2, name: 'Shift 2 (Siang)', start_time: '15:00', end_time: '23:00', color_code: '#10B981' },
        { id: 3, name: 'Shift 3 (Malam)', start_time: '23:00', end_time: '07:00', color_code: '#8B5CF6' }
      ];
      
      // Process assignments
      const assignments = (rosterResponse.data?.rosters || []).map((roster: any) => ({
        id: roster.id,
        employee_id: roster.employee_id,
        machine_id: roster.machine_id,
        shift_id: roster.shift_id,
        date: roster.roster_date,
        employee: employees.find((e: Employee) => e.id === roster.employee_id),
        machine: machines.find((m: Machine) => m.id === roster.machine_id)
      }));
      
      console.log('✅ Data processed:', {
        employees: employees.length,
        machines: machines.length,
        shifts: shifts.length,
        assignments: assignments.length
      });
      
      setData({
        employees,
        machines,
        shifts,
        assignments,
        week_dates: getWeekDates(selectedWeek)
      });
      
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      setError(`Failed to load data: ${error.message}`);
      
      // Fallback to basic data
      setData({
        employees: [],
        machines: [],
        shifts: [
          { id: 1, name: 'Shift 1 (Pagi)', start_time: '07:00', end_time: '15:00', color_code: '#3B82F6' },
          { id: 2, name: 'Shift 2 (Siang)', start_time: '15:00', end_time: '23:00', color_code: '#10B981' },
          { id: 3, name: 'Shift 3 (Malam)', start_time: '23:00', end_time: '07:00', color_code: '#8B5CF6' }
        ],
        assignments: [],
        week_dates: getWeekDates(selectedWeek)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromServer();
  }, [selectedWeek]);

  // Enhanced drag end handler with better logging
  const onDragEnd = async (result: DropResult) => {
    console.log('🎯 Drag ended:', result);
    
    if (!result.destination || !data || !selectedShift) {
      console.log('❌ Drag cancelled or invalid:', {
        destination: !!result.destination,
        data: !!data,
        selectedShift
      });
      return;
    }

    const { source, destination } = result;
    
    // Parse droppable ID: "machine-{machineId}-{date}"
    const destinationParts = destination.droppableId.split('-');
    console.log('📍 Destination parts:', destinationParts);
    
    if (destinationParts.length !== 3 || destinationParts[0] !== 'machine') {
      console.log('❌ Invalid destination format:', destination.droppableId);
      return;
    }
    
    const machineId = parseInt(destinationParts[1]);
    const date = destinationParts[2];
    const employeeId = parseInt(result.draggableId.replace('employee-', ''));

    console.log('📋 Assignment details:', {
      employeeId,
      machineId,
      selectedShift,
      date,
      source: source.droppableId,
      destination: destination.droppableId
    });

    // Check if same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('⚠️ Same position, no action needed');
      return;
    }

    try {
      setSaving(true);
      
      // Create assignment data
      const assignmentData = {
        employee_id: employeeId,
        machine_id: machineId,
        shift_id: selectedShift,
        date: date,
        notes: `Assigned via drag & drop at ${new Date().toLocaleTimeString()}`
      };

      console.log('📤 Sending assignment:', assignmentData);

      // Call assignment API
      const response = await axiosInstance.post('/api/hr/roster/assign', assignmentData);
      
      console.log('📥 Assignment response:', {
        status: response.status,
        data: response.data
      });

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Assignment successful, refreshing data...');
        
        // Refresh data from server
        await loadDataFromServer();
        
        alert('Employee assigned successfully!');
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
    } catch (error: any) {
      console.error('❌ Assignment failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to assign employee. ';
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error occurred.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication required.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const onDragStart = (initial: any) => {
    console.log('🚀 Drag started:', initial);
  };

  // Get assignments for specific machine, date, and shift
  const getAssignmentsForSlot = (machineId: number, date: string, shiftId: number) => {
    if (!data) return [];
    return data.assignments.filter(
      a => a.machine_id === machineId && a.date === date && a.shift_id === shiftId
    );
  };

  // Navigation helpers
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading roster data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button 
            onClick={loadDataFromServer}
            className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Roster Management (Robust)</h1>
        <p className="text-gray-600">Drag employees to assign them to machines and shifts</p>
        
        {/* Debug Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Debug Info:</h3>
          <div className="text-sm text-blue-700 mt-1">
            Employees: {data.employees.length} | Machines: {data.machines.length} | 
            Shifts: {data.shifts.length} | Assignments: {data.assignments.length}
          </div>
        </div>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Employee Pool */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-4">
                <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold">Available Employees</h2>
              </div>
              
              <RobustDroppable droppableId="employee-pool">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[200px] p-2 rounded border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    {data.employees.map((employee, index) => (
                      <Draggable
                        key={`employee-${employee.id}`}
                        draggableId={`employee-${employee.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 mb-2 bg-white border rounded-lg shadow-sm cursor-move transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.employee_id}</div>
                            <div className="text-xs text-gray-400">{employee.position}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </RobustDroppable>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              
              {/* Header with controls */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Weekly Roster</h2>
                  
                  <div className="flex items-center space-x-4">
                    {/* Week Navigation */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateWeek('prev')}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                      </button>
                      
                      <span className="text-sm font-medium">
                        Week of {selectedWeek.toLocaleDateString()}
                      </span>
                      
                      <button
                        onClick={() => navigateWeek('next')}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Shift Selector */}
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(parseInt(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      {data.shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Machine</th>
                      {data.week_dates.map(date => (
                        <th key={date} className="px-3 py-3 text-center text-sm font-medium text-gray-700">
                          <div>{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-xs text-gray-500">{new Date(date).getDate()}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.machines.map(machine => (
                      <tr key={machine.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <CogIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{machine.name}</div>
                              <div className="text-sm text-gray-500">{machine.code}</div>
                            </div>
                          </div>
                        </td>
                        
                        {data.week_dates.map(date => {
                          const droppableId = `machine-${machine.id}-${date}`;
                          const assignments = getAssignmentsForSlot(machine.id, date, selectedShift);
                          
                          return (
                            <td key={date} className="py-3 px-3">
                              <RobustDroppable droppableId={droppableId}>
                                {(provided, snapshot) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`min-h-[80px] p-2 rounded border-2 border-dashed transition-colors ${
                                      snapshot.isDraggingOver 
                                        ? 'border-green-400 bg-green-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {assignments.map((assignment, index) => (
                                      <div
                                        key={assignment.id}
                                        className="p-2 mb-1 bg-blue-100 border border-blue-200 rounded text-xs"
                                      >
                                        <div className="font-medium text-blue-900">
                                          {assignment.employee?.name || `Employee ${assignment.employee_id}`}
                                        </div>
                                        <div className="text-blue-700">
                                          {assignment.employee?.employee_id}
                                        </div>
                                      </div>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </RobustDroppable>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* Loading Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span>Saving assignment...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterDragDropRobust;
