import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { format, startOfWeek, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  useGetEmployeesQuery,
  useGetMachinesQuery,
  useGetShiftsQuery,
  useGetRosterQuery,
  useAssignRosterMutation,
  useUnassignRosterMutation,
  useGetWeeklyRosterQuery
} from '../../services/api';
interface Employee {
  id: number;
  employee_number: string;
  full_name: string;
  department: string;
  position: string;
  is_active: boolean;
}

interface Machine {
  id: number;
  name: string;
  code: string;
  status: string;
  department: string;
  is_active: boolean;
}

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface RosterEntry {
  id: number;
  employee_id: number;
  employee_name: string;
  shift_id: number;
  shift_name: string;
  machine_id?: number;
  machine_name?: string;
  roster_date: string;
  is_off_day: boolean;
  notes?: string;
}

const RosterManagementIntegrated: React.FC = () => {

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<number | null>(null);

  // API Queries - Integrated data sources
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({});
  const { data: machinesData, isLoading: machinesLoading } = useGetMachinesQuery();
  const { data: shiftsData, isLoading: shiftsLoading } = useGetShiftsQuery();
  
  // Roster data for the selected week
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  
  const { 
    data: rosterData, 
    isLoading: rosterLoading,
    refetch: refetchRoster 
  } = useGetRosterQuery({
    start_date: format(weekStart, 'yyyy-MM-dd'),
    end_date: format(weekEnd, 'yyyy-MM-dd')
  });

  // Mutations
  const [assignRoster] = useAssignRosterMutation();
  const [unassignRoster] = useUnassignRosterMutation();

  // Process data
  const employees: Employee[] = employeesData?.employees || [];
  const machines: Machine[] = machinesData?.machines || [];
  const shifts: Shift[] = shiftsData?.shifts || [];
  const rosters: RosterEntry[] = rosterData?.rosters || [];

  // FunnelIcon active employees and machines
  const activeEmployees = employees.filter(emp => emp.is_active);
  const activeMachines = machines.filter(machine => machine.is_active);
  const activeShifts = shifts.filter(shift => shift.is_active);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get roster for specific date, shift, and machine
  const getRosterForSlot = (date: Date, shiftId: number, machineId: number): RosterEntry | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return rosters.find(r => 
      r.roster_date === dateStr && 
      r.shift_id === shiftId && 
      r.machine_id === machineId
    ) || null;
  };

  // Get unassigned employees for a specific shift and date
  const getUnassignedEmployees = (date: Date, shiftId: number): Employee[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const assignedEmployeeIds = rosters
      .filter(r => r.roster_date === dateStr && r.shift_id === shiftId)
      .map(r => r.employee_id);
    
    return activeEmployees.filter(emp => !assignedEmployeeIds.includes(emp.id));
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Parse draggable ID (format: "employee-{id}")
    const employeeId = parseInt(draggableId.split('-')[1]);
    
    // Parse destination ID (format: "slot-{date}-{shiftId}-{machineId}")
    const [, dateStr, shiftIdStr, machineIdStr] = destination.droppableId.split('-');
    const shiftId = parseInt(shiftIdStr);
    const machineId = parseInt(machineIdStr);

    console.log('Drag ended:', {
      employeeId,
      machineId,
      shiftId,
      date: dateStr
    });

    try {
      await assignRoster({
        employee_id: employeeId,
        machine_id: machineId,
        shift_id: shiftId,
        date: dateStr,
        notes: `Assigned via drag & drop on ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`
      }).unwrap();

      console.log('Assignment successful');
      
      // Refresh roster data
      await refetchRoster();
      
    } catch (error) {
      console.error('Assignment failed:', error);
      alert('Failed to assign employee. Please try again.');
    }
  };

  // Handle unassign
  const handleUnassign = async (rosterId: number) => {
    try {
      await unassignRoster({ roster_id: rosterId }).unwrap();
      await refetchRoster();
    } catch (error) {
      console.error('Unassign failed:', error);
      alert('Failed to unassign employee. Please try again.');
    }
  };

  if (employeesLoading || machinesLoading || shiftsLoading || rosterLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading roster data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Roster Management - Integrated
          </h1>
          <p className="text-gray-600">
            Drag employees to assign them to machines and shifts. 
            Data integrated from HR Employee module and Production Machine module.
          </p>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                ← Previous Week
              </button>
              <h2 className="text-lg font-semibold">
                Week of {format(weekStart, 'MMM dd, yyyy', { locale: id })}
              </h2>
              <button
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Next Week →
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedShift || ''}
                onChange={(e) => setSelectedShift(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Shifts</option>
                {activeShifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.start_time} - {shift.end_time})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Active Employees</h3>
            <p className="text-2xl font-bold text-blue-600">{activeEmployees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Active Machines</h3>
            <p className="text-2xl font-bold text-green-600">{activeMachines.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Active Shifts</h3>
            <p className="text-2xl font-bold text-purple-600">{activeShifts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">This Week Assignments</h3>
            <p className="text-2xl font-bold text-orange-600">{rosters.length}</p>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Employee Pool */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Available Employees
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activeEmployees.map((employee) => (
                    <Draggable
                      key={employee.id}
                      draggableId={`employee-${employee.id}`}
                      index={employee.id}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 rounded-lg border cursor-move transition-colors ${
                            snapshot.isDragging
                              ? 'bg-blue-50 border-blue-300 shadow-lg'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-medium text-sm">{employee.full_name}</div>
                          <div className="text-xs text-gray-500">
                            {employee.employee_number} • {employee.department}
                          </div>
                          <div className="text-xs text-gray-400">{employee.position}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              </div>
            </div>

            {/* Roster Grid */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Weekly Roster - Machine Assignments
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Machine / Shift
                        </th>
                        {weekDays.map((day) => (
                          <th key={day.toISOString()} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div>{format(day, 'EEE', { locale: id })}</div>
                            <div className="font-normal">{format(day, 'dd/MM')}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeMachines.map((machine) => (
                        <React.Fragment key={machine.id}>
                          {(selectedShift ? activeShifts.filter(s => s.id === selectedShift) : activeShifts).map((shift) => (
                            <tr key={`${machine.id}-${shift.id}`} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {machine.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {machine.code} • {shift.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {shift.start_time} - {shift.end_time}
                                </div>
                              </td>
                              {weekDays.map((day) => {
                                const roster = getRosterForSlot(day, shift.id, machine.id);
                                const slotId = `slot-${format(day, 'yyyy-MM-dd')}-${shift.id}-${machine.id}`;
                                
                                return (
                                  <td key={day.toISOString()} className="px-4 py-4">
                                    <Droppable droppableId={slotId}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className={`min-h-[60px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                                            snapshot.isDraggingOver
                                              ? 'border-blue-400 bg-blue-50'
                                              : roster
                                              ? 'border-green-300 bg-green-50'
                                              : 'border-gray-300 bg-gray-50'
                                          }`}
                                        >
                                          {roster ? (
                                            <div className="text-xs">
                                              <div className="font-medium text-green-800">
                                                {roster.employee_name}
                                              </div>
                                              <div className="text-green-600 mt-1">
                                              </div>
                                              <button
                                                onClick={() => handleUnassign(roster.id)}
                                                className="text-red-500 hover:text-red-700 text-xs mt-1"
                                              >
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-400 text-center">
                                              Drop employee here
                                            </div>
                                          )}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Integration Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Data Integration</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Employee Data:</strong> Integrated from HR Employee module ({activeEmployees.length} active employees)</p>
            <p>• <strong>Machine Data:</strong> Integrated from Production Machine module ({activeMachines.length} active machines)</p>
            <p>• <strong>Shift Data:</strong> Integrated from HR Shift module ({activeShifts.length} active shifts)</p>
            <p>• <strong>Real-time Sync:</strong> All assignments automatically refresh data across modules</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RosterManagementIntegrated;
