import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  EyeIcon
,
  PlusIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
// Fix untuk React 18 Strict Mode
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
  full_name: string;
  employee_number: string;
  department: {
    id: number;
    name: string;
  };
  position: string;
  is_active: boolean;
}

interface Machine {
  id: number;
  name: string;
  code: string;
  machine_type: string;
  department: string;
  status: string;
  is_active: boolean;
}

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface RosterAssignment {
  id: number;
  employee_id: number;
  employee_name: string;
  machine_id: number;
  machine_name: string;
  shift_id: number;
  shift_name: string;
  roster_date: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
}

const RosterManagementComplete: React.FC = () => {
  const { t } = useLanguage();

  // State Management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<RosterAssignment[]>([]);
  
  // UI State
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Week dates helper
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

  const weekDates = getWeekDates(selectedWeek);

  // Load all data
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading all roster data...');
      
      // Load employees from HR module
      const employeesResponse = await axiosInstance.get('/api/hr/employees?active=true');
      console.log('👥 Employees loaded:', employeesResponse.data);
      
      // Load machines from Production module
      const machinesResponse = await axiosInstance.get('/api/production/machines');
      console.log('🏭 Machines loaded:', machinesResponse.data);
      
      // Load shifts from HR module
      const shiftsResponse = await axiosInstance.get('/api/hr/shifts');
      console.log('⏰ Shifts loaded:', shiftsResponse.data);
      
      // Load roster assignments for current week
      const weekStart = weekDates[0];
      const weekEnd = weekDates[6];
      const rostersResponse = await axiosInstance.get(`/api/hr/roster?start_date=${weekStart}&end_date=${weekEnd}`);
      console.log('📊 Rosters loaded:', rostersResponse.data);
      console.log('📊 Raw roster data:', rostersResponse.data?.rosters);
      
      // Process roster data with detailed logging
      const rawRosters = rostersResponse.data?.rosters || [];
      console.log('📊 Processing', rawRosters.length, 'roster entries');
      
      const processedAssignments = rawRosters.map((roster: any, index: number) => {
        console.log(`📊 Processing roster ${index + 1}:`, {
          id: roster.id,
          employee_id: roster.employee_id,
          employee_name: roster.employee_name,
          machine_id: roster.machine_id,
          machine_name: roster.machine_name,
          shift_id: roster.shift_id,
          shift_name: roster.shift_name,
          roster_date: roster.roster_date,
          status: roster.status || 'active'
        });
        
        return {
          id: roster.id,
          employee_id: roster.employee_id,
          employee_name: roster.employee_name || `Employee ${roster.employee_id}`,
          machine_id: roster.machine_id,
          machine_name: roster.machine_name || `Machine ${roster.machine_id}`,
          shift_id: roster.shift_id,
          shift_name: roster.shift_name || `Shift ${roster.shift_id}`,
          roster_date: roster.roster_date,
          notes: roster.notes,
          status: roster.status || 'active'
        };
      });
      
      console.log('📊 Processed assignments:', processedAssignments);
      
      // Set data
      setEmployees(employeesResponse.data?.employees || []);
      setMachines(machinesResponse.data?.machines || []);
      setShifts(shiftsResponse.data?.shifts || [
        { id: 1, name: 'Shift 1 (Pagi)', start_time: '07:00', end_time: '15:00', is_active: true },
        { id: 2, name: 'Shift 2 (Siang)', start_time: '15:00', end_time: '23:00', is_active: true },
        { id: 3, name: 'Shift 3 (Malam)', start_time: '23:00', end_time: '07:00', is_active: true }
      ]);
      setAssignments(processedAssignments);
      
      console.log('✅ All data loaded successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and week change
  useEffect(() => {
    loadAllData();
  }, [selectedWeek]);

  // Check if employee already assigned in the week
  const isEmployeeAssignedInWeek = (employeeId: number, targetShiftId: number) => {
    return assignments.some(assignment => 
      assignment.employee_id === employeeId && 
      assignment.shift_id === targetShiftId &&
      weekDates.includes(assignment.roster_date) &&
      assignment.status === 'active'
    );
  };

  // Check if slot already has assignment
  const isSlotOccupied = (machineId: number, date: string, shiftId: number) => {
    return assignments.some(assignment =>
      assignment.machine_id === machineId &&
      assignment.roster_date === date &&
      assignment.shift_id === shiftId &&
      assignment.status === 'active'
    );
  };

  // Drag and drop handler with validation
  const onDragEnd = async (result: DropResult) => {
    console.log('🎯 Drag ended:', result);
    
    if (!result.destination) {
      console.log('❌ No destination');
      return;
    }

    const { source, destination } = result;
    
    // Parse destination: "machine-{machineId}-{date}"
    const [type, machineIdStr, date] = destination.droppableId.split('-');
    
    if (type !== 'machine') {
      console.log('❌ Invalid destination type:', type);
      return;
    }
    
    const machineId = parseInt(machineIdStr);
    const employeeId = parseInt(result.draggableId.replace('employee-', ''));
    
    console.log('📋 Assignment data:', {
      employeeId,
      machineId,
      shiftId: selectedShift,
      date
    });

    // Validation 1: Check if employee already assigned in this week for this shift
    if (isEmployeeAssignedInWeek(employeeId, selectedShift)) {
      const employee = employees.find(e => e.id === employeeId);
      const shift = shifts.find(s => s.id === selectedShift);
      alert(`❌ ${employee?.full_name} is already assigned in this week for ${shift?.name}!\nOne employee can only be assigned once per shift per week.`);
      return;
    }

    // Validation 2: Check if slot is already occupied
    if (isSlotOccupied(machineId, date, selectedShift)) {
      const machine = machines.find(m => m.id === machineId);
      const shift = shifts.find(s => s.id === selectedShift);
      alert(`❌ This slot is already occupied!\nMachine: ${machine?.name}\nDate: ${new Date(date).toLocaleDateString()}\nShift: ${shift?.name}`);
      return;
    }

    // Show confirmation dialog
    const employee = employees.find(e => e.id === employeeId);
    const machine = machines.find(m => m.id === machineId);
    const shift = shifts.find(s => s.id === selectedShift);
    
    const confirmMessage = `Assign ${employee?.full_name} to:\n` +
                          `Machine: ${machine?.name}\n` +
                          `Date: ${new Date(date).toLocaleDateString()}\n` +
                          `Shift: ${shift?.name}\n\n` +
                          `Continue?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Starting assignment process...');
      
      // Prepare assignment data
      const assignmentData = {
        employee_id: employeeId,
        machine_id: machineId,
        shift_id: selectedShift,
        date: date,
        notes: `Assigned via drag & drop on ${new Date().toLocaleString()}`
      };

      console.log('📤 Sending assignment:', assignmentData);

      // Call assignment API
      const response = await axiosInstance.post('/api/hr/roster/assign', assignmentData);
      
      console.log('📥 Assignment response:', {
        status: response.status,
        data: response.data
      });

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Assignment API successful');
        
        // Force reload all data to ensure fresh state
        console.log('🔄 Reloading all data...');
        await loadAllData();
        
        console.log('✅ Data reloaded successfully');
        
        // Show success message
        alert(`✅ Assignment successful!\n${employee?.full_name} assigned to ${machine?.name}`);
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
      
      let errorMessage = 'Failed to assign employee.\n';
      if (error.response?.data?.error) {
        errorMessage += `Error: ${error.response.data.error}`;
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication required. Please login again.';
      } else if (error.response?.status === 400) {
        errorMessage += 'Invalid assignment data. Please check your selection.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error occurred. Please try again.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Get assignments for specific slot
  const getAssignmentsForSlot = (machineId: number, date: string, shiftId: number) => {
    console.log(`🔍 Getting assignments for slot:`, {
      machineId,
      date,
      shiftId,
      totalAssignments: assignments.length
    });
    
    const slotAssignments = assignments.filter(
      a => {
        const matches = a.machine_id === machineId && 
                       a.roster_date === date && 
                       a.shift_id === shiftId &&
                       a.status === 'active';
        
        if (assignments.length > 0) {
          console.log(`🔍 Checking assignment ${a.id}:`, {
            assignment: a,
            machineMatch: a.machine_id === machineId,
            dateMatch: a.roster_date === date,
            shiftMatch: a.shift_id === shiftId,
            statusMatch: a.status === 'active',
            overallMatch: matches
          });
        }
        
        return matches;
      }
    );
    
    console.log(`🔍 Found ${slotAssignments.length} assignments for slot`, {
      machineId,
      date,
      shiftId,
      assignments: slotAssignments
    });
    
    return slotAssignments;
  };

  // Remove assignment
  const removeAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      setSaving(true);
      
      await axiosInstance.delete(`/api/hr/roster/${assignmentId}`);
      
      // Reload data
      await loadAllData();
      
      alert('Assignment removed successfully!');
    } catch (error: any) {
      console.error('❌ Failed to remove assignment:', error);
      alert('Failed to remove assignment: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Week navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  // Copy week roster
  const copyWeekRoster = async () => {
    if (!confirm('Copy current week roster to next week?')) {
      return;
    }

    try {
      setSaving(true);
      
      const weekStart = weekDates[0];
      const response = await axiosInstance.post('/api/hr/roster/copy-week', {
        source_week_start: weekStart
      });
      
      console.log('📋 Week copied:', response.data);
      alert('Week roster copied successfully!');
      
      // Navigate to next week and reload
      navigateWeek('next');
      
    } catch (error: any) {
      console.error('❌ Failed to copy week:', error);
      alert('Failed to copy week: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading roster data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={loadAllData}
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          HR Roster Management - Complete
        </h1>
        <p className="text-gray-600">
          Integrated employee scheduling with drag & drop functionality
        </p>
        
        {/* Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{employees.length}</div>
                <div className="text-sm text-blue-700">Active Employees</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-900">{machines.length}</div>
                <div className="text-sm text-green-700">Production Machines</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-purple-900">{shifts.length}</div>
                <div className="text-sm text-purple-700">Work Shifts</div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-100 p-4 rounded-lg">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-orange-900">{assignments.length}</div>
                <div className="text-sm text-orange-700">This Week Assignments</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Debug Info */}
        {assignments.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug: Current Assignments</h3>
            <div className="text-sm text-yellow-700">
              {assignments.map((assignment, index) => (
                <div key={assignment.id} className="mb-1">
                  <strong>#{index + 1}:</strong> {assignment.employee_name} → Machine {assignment.machine_id} 
                  (Date: {assignment.roster_date}, Shift: {assignment.shift_id}, Status: {assignment.status})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Employee Pool */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">Available Employees</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Drag employees to assign them to machines
                </p>
              </div>
              
              <div className="p-4">
                <StrictModeDroppable droppableId="employee-pool">
                  {(provided: any, snapshot: any) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[300px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {employees.map((employee, index) => {
                        const isAssignedThisWeek = isEmployeeAssignedInWeek(employee.id, selectedShift);
                        
                        return (
                          <Draggable
                            key={`employee-${employee.id}`}
                            draggableId={`employee-${employee.id}`}
                            index={index}
                            isDragDisabled={isAssignedThisWeek}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-3 border-2 rounded-lg transition-all ${
                                  isAssignedThisWeek
                                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                                    : snapshot.isDragging 
                                      ? 'bg-white border-blue-400 shadow-lg transform rotate-2 cursor-move' 
                                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-move'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                    isAssignedThisWeek ? 'bg-gray-200' : 'bg-blue-100'
                                  }`}>
                                    {isAssignedThisWeek ? (
                                      <CheckCircleIcon className="h-5 w-5 text-gray-500" />
                                    ) : (
                                      <UserIcon className="h-5 w-5 text-blue-600" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-medium ${isAssignedThisWeek ? 'text-gray-600' : 'text-gray-900'}`}>
                                      {employee.full_name}
                                      {isAssignedThisWeek && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-sm ${isAssignedThisWeek ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {employee.employee_number}
                                    </div>
                                    <div className={`text-xs ${isAssignedThisWeek ? 'text-gray-400' : 'text-gray-400'}`}>
                                      {employee.department?.name} - {employee.position}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      
                      {employees.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No active employees found</p>
                        </div>
                      )}
                    </div>
                  )}
                </StrictModeDroppable>
              </div>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg">
              
              {/* Controls */}
              <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Week Navigation */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateWeek('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Previous Week"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        Week of {selectedWeek.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {weekDates[0]} to {weekDates[6]}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigateWeek('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Next Week"
                    >
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Shift Selector & Actions */}
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={copyWeekRoster}
                      disabled={saving}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Copy Week
                    </button>
                    
                    <button
                      onClick={loadAllData}
                      disabled={loading}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">{t('production.machine')}</th>
                      {weekDates.map(date => (
                        <th key={date} className="px-3 py-3 text-center text-sm font-medium text-gray-700 min-w-[150px]">
                          <div className="font-semibold">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-xs text-gray-500 font-normal">
                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {machines.map(machine => (
                      <tr key={machine.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <CogIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{machine.name}</div>
                              <div className="text-sm text-gray-500">{machine.code}</div>
                              <div className="text-xs text-gray-400">
                                {machine.machine_type} - {machine.department}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {weekDates.map(date => {
                          const droppableId = `machine-${machine.id}-${date}`;
                          const slotAssignments = getAssignmentsForSlot(machine.id, date, selectedShift);
                          const isSlotOccupied = slotAssignments.length > 0;
                          
                          return (
                            <td key={date} className="px-3 py-4">
                              <StrictModeDroppable droppableId={droppableId}>
                                {(provided: any, snapshot: any) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`min-h-[100px] p-2 rounded-lg border-2 border-dashed transition-all ${
                                      isSlotOccupied
                                        ? 'border-orange-300 bg-orange-50'
                                        : snapshot.isDraggingOver 
                                          ? 'border-green-400 bg-green-50' 
                                          : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {slotAssignments.map((assignment) => (
                                      <div
                                        key={assignment.id}
                                        className="p-2 mb-2 bg-blue-100 border border-blue-200 rounded-lg group"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium text-blue-900 text-sm">
                                              {assignment.employee_name}
                                            </div>
                                            <div className="text-xs text-blue-700">
                                              {assignment.shift_name}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => removeAssignment(assignment.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                                            title="Remove Assignment"
                                          >
                                            <TrashIcon className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {provided.placeholder}
                                    
                                    {slotAssignments.length === 0 && !snapshot.isDraggingOver && (
                                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
                
                {machines.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CogIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No machines found</p>
                    <p className="text-sm">Add machines in Production module first</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* Loading Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-lg">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterManagementComplete;
