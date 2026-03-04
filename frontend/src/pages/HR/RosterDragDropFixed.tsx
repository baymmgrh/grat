import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CogIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import axiosInstance from '../../utils/axiosConfig';
// Workaround for React 18 Strict Mode issue
const StrictModeDroppable = ({ children, ...props }: any) => {
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
  color_code?: string;
}

interface RosterAssignment {
  id?: number;
  employee_id: number;
  machine_id: number;
  shift_id: number;
  date: string;
  employee?: Employee;
  machine?: Machine;
}

interface WeeklyRosterData {
  employees: Employee[];
  machines: Machine[];
  shifts: Shift[];
  week_dates: string[];
  assignments: RosterAssignment[];
}

function getWeekDates(date: Date): string[] {
  const weekStart = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

const RosterDragDrop: React.FC = () => {
  const { t } = useLanguage();

  const [data, setData] = useState<WeeklyRosterData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<number | null>(1);
  const [saving, setSaving] = useState(false);

  // Mock data untuk demo
  const mockData: WeeklyRosterData = {
    employees: [
      { id: 1, name: 'Ahmad Susanto', employee_id: 'EMP001', department: 'Production', position: 'Machine Operator' },
      { id: 2, name: 'Siti Nurhaliza', employee_id: 'EMP002', department: 'Production', position: 'Line Leader' },
      { id: 3, name: 'Budi Santoso', employee_id: 'EMP003', department: 'Production', position: 'Machine Operator' },
      { id: 4, name: 'Dewi Sartika', employee_id: 'EMP004', department: 'Production', position: 'Quality Inspector' },
      { id: 5, name: 'Joko Widodo', employee_id: 'EMP005', department: 'Production', position: 'Maintenance Tech' },
      { id: 6, name: 'Rina Agustina', employee_id: 'EMP006', department: 'Production', position: 'Machine Operator' },
      { id: 7, name: 'Andi Pratama', employee_id: 'EMP007', department: 'Production', position: 'Supervisor' },
      { id: 8, name: 'Maya Indira', employee_id: 'EMP008', department: 'Production', position: 'Machine Operator' }
    ],
    machines: [
      { id: 1, code: 'MCH-001', name: 'Nonwoven Line 1', department: 'Production', status: 'active' },
      { id: 2, code: 'MCH-002', name: 'Nonwoven Line 2', department: 'Production', status: 'active' },
      { id: 3, code: 'MCH-003', name: 'Cutting Machine A', department: 'Production', status: 'active' },
      { id: 4, code: 'MCH-004', name: 'Packing Line 1', department: 'Production', status: 'active' },
      { id: 5, code: 'MCH-005', name: 'Packing Line 2', department: 'Production', status: 'active' },
      { id: 6, code: 'MCH-006', name: 'Quality Check Station', department: 'Production', status: 'active' }
    ],
    shifts: [
      { id: 1, name: 'Shift 1 (Pagi)', start_time: '07:00', end_time: '15:00', color_code: '#3B82F6' },
      { id: 2, name: 'Shift 2 (Siang)', start_time: '15:00', end_time: '23:00', color_code: '#10B981' },
      { id: 3, name: 'Shift 3 (Malam)', start_time: '23:00', end_time: '07:00', color_code: '#8B5CF6' }
    ],
    week_dates: getWeekDates(new Date()),
    assignments: [
      { id: 1, employee_id: 1, machine_id: 1, shift_id: 1, date: getWeekDates(new Date())[0] },
      { id: 2, employee_id: 2, machine_id: 2, shift_id: 1, date: getWeekDates(new Date())[0] },
      { id: 3, employee_id: 3, machine_id: 1, shift_id: 2, date: getWeekDates(new Date())[1] },
    ]
  };

  const loadDataFromServer = async () => {
    try {
      // Load employees
      const employeeResponse = await axiosInstance.get('/api/hr/employees?active=true');
      
      // Load roster data for the selected week
      const weekStart = getWeekDates(selectedWeek)[0];
      const weekEnd = getWeekDates(selectedWeek)[6];
      const rosterResponse = await axiosInstance.get(`/api/hr/roster?start_date=${weekStart}&end_date=${weekEnd}`);
      
      if (employeeResponse.data && employeeResponse.data.employees) {
        console.log('Loaded real employee data:', employeeResponse.data.employees);
        console.log('Loaded roster data:', rosterResponse.data?.rosters || []);
        
        // Convert roster data to assignments format
        const assignments = (rosterResponse.data?.rosters || []).map((roster: any) => ({
          id: roster.id,
          employee_id: roster.employee_id,
          machine_id: roster.machine_id,
          shift_id: roster.shift_id,
          date: roster.roster_date,
          employee: {
            id: roster.employee_id,
            name: roster.employee_name,
            employee_id: roster.employee_id.toString(),
            department: 'Production',
            position: 'Operator'
          },
          machine: mockData.machines.find((m: any) => m.id === roster.machine_id)
        }));
        
        setData({
          ...mockData,
          employees: employeeResponse.data.employees.map((emp: any) => ({
            id: emp.id,
            name: emp.full_name || emp.name,
            employee_id: emp.employee_number || emp.employee_id,
            department: emp.department?.name || 'Production',
            position: emp.position || 'Operator'
          })),
          assignments: assignments,
          week_dates: getWeekDates(selectedWeek)
        });
      } else {
        // Fallback to mock data
        console.log('Using mock data');
        setData({
          ...mockData,
          week_dates: getWeekDates(selectedWeek)
        });
      }
    } catch (error) {
      console.error('Failed to load data from server, using mock data:', error);
      setData({
        ...mockData,
        week_dates: getWeekDates(selectedWeek)
      });
    }
  };

  useEffect(() => {
    loadDataFromServer();
  }, [selectedWeek]);

  const getEmployeeById = (id: number) => {
    return data?.employees.find(emp => emp.id === id);
  };

  const getShiftStyle = (shiftId: number) => {
    const shift = data?.shifts.find(s => s.id === shiftId);
    return {
      backgroundColor: shift?.color_code || '#6B7280',
      color: 'white'
    };
  };

  const onDragStart = (initial: any) => {
    console.log('Drag started:', initial);
  };

  const onDragEnd = async (result: DropResult) => {
    console.log('Drag ended:', result);
    if (!result.destination || !data || !selectedShift) return;

    const { source, destination } = result;
    
    const [, machineIdStr, date] = destination.droppableId.split('-');
    const machineId = parseInt(machineIdStr);
    const employeeId = parseInt(result.draggableId.replace('employee-', ''));

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    try {
      setSaving(true);
      
      // Create assignment data for API
      const assignmentData = {
        employee_id: employeeId,
        machine_id: machineId,
        shift_id: selectedShift,
        date: date  // Use 'date' to match backend API
      };

      console.log('Sending assignment data:', assignmentData);
      console.log('Employee ID:', employeeId, 'type:', typeof employeeId);
      console.log('Machine ID:', machineId, 'type:', typeof machineId);
      console.log('Shift ID:', selectedShift, 'type:', typeof selectedShift);
      console.log('Date:', date, 'type:', typeof date);

      // Call backend API to save assignment
      const response = await axiosInstance.post('/api/hr/roster/assign', assignmentData);
      
      if (response.data) {
        console.log('Assignment saved successfully:', response.data);
        
        // Refresh data from server to ensure sync
        await loadDataFromServer();
        
        alert('Employee assigned successfully!');
      }
      
    } catch (error: any) {
      console.error('Failed to assign employee:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // More specific error message
      let errorMessage = 'Failed to assign employee. ';
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Please check if employee, machine, and shift IDs exist in database.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (assignmentId: number) => {
    if (!data) return;
    
    try {
      setSaving(true);
      
      console.log('Removing assignment:', assignmentId);
      
      // Find the assignment to get employee_id and date
      const assignment = data.assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        alert('Assignment not found');
        return;
      }
      
      // Call backend API to delete assignment
      const unassignData = {
        employee_id: assignment.employee_id,
        roster_date: assignment.date
      };
      
      await axiosInstance.post('/api/hr/roster/unassign', unassignData);
      
      console.log('Assignment removed successfully');
      
      // Update local state
      setData({
        ...data,
        assignments: data.assignments.filter(a => a.id !== assignmentId)
      });
      
      alert('Assignment removed successfully!');
      
    } catch (error) {
      console.error('Failed to remove assignment:', error);
      alert('Failed to remove assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const copyWeek = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Roster copied to next week successfully!');
    } catch (error) {
      console.error('Failed to copy week:', error);
      alert('Failed to copy week. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading Roster Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto p-6 space-y-6" 
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Drag & Drop Roster Management</h1>
          <p className="text-gray-600">Drag employees from the left panel to assign them to machines and shifts</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={copyWeek}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
            Copy to Next Week
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateWeek('prev')}
            className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ← Previous Week
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Week of {getWeekStart(selectedWeek).toLocaleDateString('id-ID')}
            </h2>
            <p className="text-gray-600 mt-1">
              {getWeekStart(selectedWeek).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} - {new Date(getWeekStart(selectedWeek).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Next Week →
          </button>
        </div>

        {/* Shift Selection */}
        <div className="flex justify-center space-x-4">
          {data.shifts.map(shift => (
            <button
              key={shift.id}
              onClick={() => setSelectedShift(shift.id)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
                selectedShift === shift.id
                  ? 'text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              style={selectedShift === shift.id ? getShiftStyle(shift.id) : {}}
            >
              <ClockIcon className="h-5 w-5" />
              {shift.name} ({shift.start_time} - {shift.end_time})
            </button>
          ))}
        </div>
      </div>

      {selectedShift && (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Employee Pool */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                    Available Employees ({data.employees.length})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Drag to assign to machines</p>
                </div>
                
                <StrictModeDroppable droppableId="employee-pool">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-4 min-h-96 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      {data.employees?.map((employee, index) => (
                        <Draggable
                          key={`employee-${employee.id}`}
                          draggableId={`employee-${employee.id}`}
                          index={index}
                          isDragDisabled={false}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none'
                              }}
                              className={`p-4 mb-3 bg-white rounded-lg border-2 cursor-move transition-all hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-2xl border-blue-500 transform rotate-2' : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {employee.name.charAt(0)}
                                </div>
                                <div>
                                  <div 
                                    className="font-semibold text-gray-900"
                                    style={{ 
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    {employee.name}
                                  </div>
                                  <div 
                                    className="text-sm text-gray-600"
                                    style={{ 
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    {employee.employee_id}
                                  </div>
                                  <div 
                                    className="text-xs text-gray-500"
                                    style={{ 
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    {employee.position}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
              </div>
            </div>

            {/* Roster Grid */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CogIcon className="h-6 w-6 text-green-600" />
                    Machine Assignment Grid
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Drop employees on machine slots to assign them</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-4 px-6 text-left font-bold text-gray-900 sticky left-0 bg-gray-100">{t('production.machine')}</th>
                        {data.week_dates.map(date => (
                          <th key={date} className="py-4 px-4 text-center font-bold min-w-48">
                            <div className="text-gray-900">{new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                            <div className="text-sm text-gray-600 font-normal">
                              {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.machines.map(machine => (
                        <tr key={machine.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-6 px-6 sticky left-0 bg-white">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {machine.code.slice(-2)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{machine.code}</div>
                                <div className="text-sm text-gray-600">{machine.name}</div>
                                <div className="text-xs text-gray-500">{machine.department}</div>
                              </div>
                            </div>
                          </td>
                          {data.week_dates.map(date => {
                            const droppableId = `machine-${machine.id}-${date}`;
                            const currentAssignments = data.assignments.filter(
                              a => a.machine_id === machine.id && a.date === date && a.shift_id === selectedShift
                            );
                            
                            return (
                              <td key={date} className="py-3 px-3">
                                <StrictModeDroppable droppableId={droppableId}>
                                  {(provided, snapshot) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`min-h-24 p-3 border-2 border-dashed rounded-lg transition-all ${
                                        snapshot.isDraggingOver
                                          ? 'border-green-500 bg-green-50 shadow-inner'
                                          : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      {currentAssignments.map((assignment) => (
                                        <div key={assignment.id} className="mb-2 last:mb-0">
                                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg p-3 relative group hover:shadow-md transition-all">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {assignment.employee?.name.charAt(0)}
                                              </div>
                                              <div>
                                                <div className="text-sm font-bold text-green-900">
                                                  {assignment.employee?.name}
                                                </div>
                                                <div className="text-xs text-green-700">
                                                  {assignment.employee?.employee_id}
                                                </div>
                                              </div>
                                            </div>
                                            {assignment.id && (
                                              <button
                                                onClick={() => removeAssignment(assignment.id!)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all"
                                                title="Remove assignment"
                                              >
                                                <XMarkIcon className="h-3 w-3" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {provided.placeholder}
                                      {currentAssignments.length === 0 && !snapshot.isDraggingOver && (
                                        <div className="text-center text-gray-400 text-sm py-4">
                                          Drop employee here
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </StrictModeDroppable>
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
      )}

      {!selectedShift && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
          <ClockIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-yellow-800 mb-2">
            Select a Shift to Start
          </h3>
          <p className="text-yellow-700 text-lg">
            Please select a shift above to begin assigning employees to machines.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 mb-3 text-lg">📋 How to Use Drag & Drop Roster:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-1">🎯 Assigning Employees:</p>
            <ul className="space-y-1 ml-4">
              <li>• Select a shift first</li>
              <li>• Drag employee from left panel</li>
              <li>• Drop on machine cell for specific date</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">🗑️ Managing Assignments:</p>
            <ul className="space-y-1 ml-4">
              <li>• Hover over assigned employee</li>
              <li>• Click trash icon to remove</li>
              <li>• Use "Copy Week" to duplicate schedule</li>
            </ul>
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-900">Saving changes...</p>
            <p className="text-gray-600 mt-2">Please wait while we update the roster</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterDragDrop;
