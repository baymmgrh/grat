import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CogIcon,
  DocumentDuplicateIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import axios from 'axios';
interface Employee {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  shift_preference?: string;
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
  shift?: Shift;
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock data for demonstration
  const mockData: WeeklyRosterData = {
    employees: [
      { id: 1, name: 'Ahmad Susanto', employee_id: 'EMP001', department: t('navigation.production'), position: 'Machine Operator' },
      { id: 2, name: 'Siti Nurhaliza', employee_id: 'EMP002', department: t('navigation.production'), position: 'Line Leader' },
      { id: 3, name: 'Budi Santoso', employee_id: 'EMP003', department: t('navigation.production'), position: 'Machine Operator' },
      { id: 4, name: 'Dewi Sartika', employee_id: 'EMP004', department: t('navigation.production'), position: 'Quality Inspector' },
      { id: 5, name: 'Joko Widodo', employee_id: 'EMP005', department: t('navigation.production'), position: 'Maintenance Tech' },
      { id: 6, name: 'Rina Agustina', employee_id: 'EMP006', department: t('navigation.production'), position: 'Machine Operator' },
      { id: 7, name: 'Andi Pratama', employee_id: 'EMP007', department: t('navigation.production'), position: t('production.supervisor') },
      { id: 8, name: 'Maya Indira', employee_id: 'EMP008', department: t('navigation.production'), position: 'Machine Operator' }
    ],
    machines: [
      { id: 1, code: 'MCH-001', name: 'Nonwoven Line 1', department: t('navigation.production'), status: 'active' },
      { id: 2, code: 'MCH-002', name: 'Nonwoven Line 2', department: t('navigation.production'), status: 'active' },
      { id: 3, code: 'MCH-003', name: 'Cutting Machine A', department: t('navigation.production'), status: 'active' },
      { id: 4, code: 'MCH-004', name: 'Packing Line 1', department: t('navigation.production'), status: 'active' },
      { id: 5, code: 'MCH-005', name: 'Packing Line 2', department: t('navigation.production'), status: 'active' },
      { id: 6, code: 'MCH-006', name: 'Quality Check Station', department: t('navigation.production'), status: 'active' }
    ],
    shifts: [
      { id: 1, name: 'Shift 1 (Pagi)', start_time: '07:00', end_time: '15:00', color_code: '#3B82F6' },
      { id: 2, name: 'Shift 2 (Siang)', start_time: '15:00', end_time: '23:00', color_code: '#10B981' },
      { id: 3, name: 'Shift 3 (Malam)', start_time: '23:00', end_time: '07:00', color_code: '#8B5CF6' }
    ],
    week_dates: getWeekDates(new Date()),
    assignments: [
      // Some sample assignments
      { id: 1, employee_id: 1, machine_id: 1, shift_id: 1, date: getWeekDates(new Date())[0] },
      { id: 2, employee_id: 2, machine_id: 2, shift_id: 1, date: getWeekDates(new Date())[0] },
      { id: 3, employee_id: 3, machine_id: 1, shift_id: 2, date: getWeekDates(new Date())[1] },
    ]
  };

  useEffect(() => {
    // Initialize with mock data
    setData({
      ...mockData,
      week_dates: getWeekDates(selectedWeek)
    });
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

  const getAssignment = (employeeId: number, machineId: number, date: string) => {
    return data?.assignments.find(
      a => a.employee_id === employeeId && a.machine_id === machineId && a.date === date && a.shift_id === selectedShift
    );
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !data || !selectedShift) return;

    const { source, destination } = result;
    
    // Parse the droppableId: "machine-{machineId}-{date}"
    const [, machineIdStr, date] = destination.droppableId.split('-');
    const machineId = parseInt(machineIdStr);
    const employeeId = parseInt(result.draggableId.replace('employee-', ''));

    // Check if dropping on the same location
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    try {
      setSaving(true);
      
      // Create new assignment
      const newAssignment: RosterAssignment = {
        id: Date.now(), // Mock ID
        employee_id: employeeId,
        machine_id: machineId,
        shift_id: selectedShift,
        date: date,
        employee: getEmployeeById(employeeId),
        machine: data.machines.find(m => m.id === machineId)
      };

      // Remove existing assignment for this employee on this date/shift
      const filteredAssignments = data.assignments.filter(
        a => !(a.employee_id === employeeId && a.date === date && a.shift_id === selectedShift)
      );

      // Add new assignment
      setData({
        ...data,
        assignments: [...filteredAssignments, newAssignment]
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Failed to assign employee:', error);
      alert('Failed to assign employee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (assignmentId: number) => {
    if (!data) return;
    
    try {
      setSaving(true);
      
      // Remove assignment
      setData({
        ...data,
        assignments: data.assignments.filter(a => a.id !== assignmentId)
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Failed to remove assignment:', error);
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

  if (loading || !data) {
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
    <div className="container mx-auto p-6 space-y-6">
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
        <DragDropContext onDragEnd={onDragEnd}>
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
                
                <Droppable droppableId="employee-pool">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-4 min-h-96 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      {data.employees.map((employee, index) => (
                        <Draggable
                          key={employee.id}
                          draggableId={`employee-${employee.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 mb-3 bg-white rounded-lg border-2 cursor-move transition-all hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-2xl border-blue-500 transform rotate-2' : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {employee.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{employee.name}</div>
                                  <div className="text-sm text-gray-600">{employee.employee_id}</div>
                                  <div className="text-xs text-gray-500">{employee.position}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
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
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left font-semibold">{t('production.machine')}</th>
                        {data.week_dates.map(date => (
                          <th key={date} className="py-3 px-4 text-center font-semibold min-w-40">
                            <div>{new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.machines.map(machine => (
                        <tr key={machine.id} className="border-b">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-semibold">{machine.code}</div>
                              <div className="text-sm text-gray-600">{machine.name}</div>
                              <div className="text-xs text-gray-500">{machine.department}</div>
                            </div>
                          </td>
                          {data.week_dates.map(date => {
                            const droppableId = `machine-${machine.id}-${date}`;
                            const currentAssignments = data.assignments.filter(
                              a => a.machine_id === machine.id && a.date === date && a.shift_id === selectedShift
                            );
                            
                            return (
                              <td key={date} className="py-2 px-2">
                                <Droppable droppableId={droppableId}>
                                  {(provided, snapshot) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={`min-h-20 p-2 border-2 border-dashed rounded-lg ${
                                        snapshot.isDraggingOver
                                          ? 'border-blue-500 bg-blue-50'
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      {currentAssignments.map((assignment, index) => (
                                        <div key={assignment.id} className="mb-2 last:mb-0">
                                          <div className="bg-green-100 border border-green-300 rounded p-2 relative group">
                                            <div className="text-sm font-medium">
                                              {assignment.employee?.name}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              {assignment.employee?.employee_id}
                                            </div>
                                            {assignment.id && (
                                              <button
                                                onClick={() => removeAssignment(assignment.id!)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <ClockIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Select a Shift to Start
          </h3>
          <p className="text-yellow-700">
            Please select a shift above to begin assigning employees to machines.
          </p>
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg">Saving changes...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterDragDrop;
