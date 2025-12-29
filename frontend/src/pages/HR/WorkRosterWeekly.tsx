import { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CogIcon, 
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  ScaleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface Employee {
  id: number;
  employee_number: string;
  full_name: string;
  department: string | null;
  position: string | null;
  is_assigned: boolean;
  has_skill: boolean;
}

interface Machine {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  id?: number;
  employee_id: number;
  employee_name?: string;
  employee_number?: string;
  machine_id?: number | null;
  machine_name?: string | null;
  position: number;
  is_backup: boolean;
  status: string;
  notes?: string;
}

interface RoleDefinition {
  name: string;
  requires_machine: boolean;
  color: string;
}

interface WeeklyRoster {
  id: number;
  year: number;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  leader_shift_1_id: number | null;
  leader_shift_1_name: string | null;
  leader_shift_2_id: number | null;
  leader_shift_2_name: string | null;
  leader_shift_3_id: number | null;
  leader_shift_3_name: string | null;
  status: string;
  notes: string | null;
  assignments: {
    shift_1: { [role: string]: Assignment[] };
    shift_2: { [role: string]: Assignment[] };
    shift_3: { [role: string]: Assignment[] };
  };
}

const SHIFTS = [
  { value: 'shift_1', label: 'Shift 1 (06:30 - 15:00)', shortLabel: 'Shift 1' },
  { value: 'shift_2', label: 'Shift 2 (15:00 - 23:00)', shortLabel: 'Shift 2' },
  { value: 'shift_3', label: 'Shift 3 (23:00 - 06:30)', shortLabel: 'Shift 3' },
];

const ROLE_ICONS: { [key: string]: React.ElementType } = {
  operator: CogIcon,
  qc: ClipboardDocumentCheckIcon,
  maintenance: WrenchScrewdriverIcon,
  packing_machine: CubeIcon,
  packing_manual: CubeIcon,
  timbang_box: ScaleIcon,
  helper: UserIcon,
};

// Get week number from date
function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

// Get Monday of the week
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Get Sunday of the week
function getSunday(date: Date): Date {
  const monday = getMonday(date);
  return new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
}

export default function WorkRosterWeekly() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState('shift_1');
  const [roster, setRoster] = useState<WeeklyRoster | null>(null);
  const [weekInfo, setWeekInfo] = useState<{ year: number; week_number: number; week_start_date: string; week_end_date: string } | null>(null);
  const [roleDefinitions, setRoleDefinitions] = useState<{ [key: string]: RoleDefinition }>({});
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state for each shift
  const [leaderIds, setLeaderIds] = useState<{ shift_1: number | null; shift_2: number | null; shift_3: number | null }>({
    shift_1: null,
    shift_2: null,
    shift_3: null
  });
  const [assignments, setAssignments] = useState<{
    shift_1: { [role: string]: Assignment[] };
    shift_2: { [role: string]: Assignment[] };
    shift_3: { [role: string]: Assignment[] };
  }>({
    shift_1: {},
    shift_2: {},
    shift_3: {}
  });
  const [notes, setNotes] = useState('');
  
  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentMachineId, setCurrentMachineId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Computed week info
  const { week, year } = getWeekNumber(currentDate);
  const weekStart = getMonday(currentDate);
  const weekEnd = getSunday(currentDate);

  // Fetch machines
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axiosInstance.get('/api/production/machines');
        if (response.data.machines) {
          setMachines(response.data.machines.filter((m: Machine & { is_active: boolean }) => m.is_active !== false));
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };
    fetchMachines();
  }, []);

  // Fetch roster data
  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/hr/work-roster/rosters/by-week', {
        params: { year, week }
      });
      
      if (response.data.success) {
        setRoleDefinitions(response.data.role_definitions || {});
        
        if (response.data.roster) {
          setRoster(response.data.roster);
          setLeaderIds({
            shift_1: response.data.roster.leader_shift_1_id,
            shift_2: response.data.roster.leader_shift_2_id,
            shift_3: response.data.roster.leader_shift_3_id
          });
          setAssignments(response.data.roster.assignments || {
            shift_1: {},
            shift_2: {},
            shift_3: {}
          });
          setNotes(response.data.roster.notes || '');
        } else {
          // Initialize empty roster
          setRoster(null);
          setWeekInfo(response.data.week_info);
          setLeaderIds({ shift_1: null, shift_2: null, shift_3: null });
          const emptyAssignments: any = { shift_1: {}, shift_2: {}, shift_3: {} };
          Object.keys(response.data.role_definitions || {}).forEach(role => {
            emptyAssignments.shift_1[role] = [];
            emptyAssignments.shift_2[role] = [];
            emptyAssignments.shift_3[role] = [];
          });
          setAssignments(emptyAssignments);
          setNotes('');
        }
      }
    } catch (error) {
      console.error('Error fetching roster:', error);
      toast.error('Gagal memuat data roster');
    } finally {
      setLoading(false);
    }
  }, [year, week]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const params: any = { search: searchTerm };
      const response = await axiosInstance.get('/api/hr/work-roster/employees/available', { params });
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Open employee selection modal
  const openEmployeeModal = (role: string, machineId?: number | null) => {
    setCurrentRole(role);
    setCurrentMachineId(machineId || null);
    setSearchTerm('');
    setShowEmployeeModal(true);
    fetchEmployees();
  };

  // Add employee to role
  const addEmployee = (employee: Employee) => {
    const shiftAssignments = { ...assignments[selectedShift as keyof typeof assignments] };
    const roleAssignments = [...(shiftAssignments[currentRole] || [])];
    
    // Check if already assigned
    const exists = roleAssignments.some(a => 
      a.employee_id === employee.id && 
      a.machine_id === currentMachineId
    );
    
    if (exists) {
      toast.error('Karyawan sudah di-assign ke posisi ini');
      return;
    }
    
    roleAssignments.push({
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_number: employee.employee_number,
      machine_id: currentMachineId,
      machine_name: machines.find(m => m.id === currentMachineId)?.name || null,
      position: roleAssignments.length + 1,
      is_backup: false,
      status: 'assigned'
    });
    
    shiftAssignments[currentRole] = roleAssignments;
    
    setAssignments(prev => ({
      ...prev,
      [selectedShift]: shiftAssignments
    }));
    
    setShowEmployeeModal(false);
    toast.success(`${employee.full_name} ditambahkan ke ${roleDefinitions[currentRole]?.name || currentRole}`);
  };

  // Remove assignment
  const removeAssignment = (role: string, index: number) => {
    const shiftAssignments = { ...assignments[selectedShift as keyof typeof assignments] };
    const roleAssignments = [...(shiftAssignments[role] || [])];
    roleAssignments.splice(index, 1);
    
    roleAssignments.forEach((a, i) => {
      a.position = i + 1;
    });
    
    shiftAssignments[role] = roleAssignments;
    
    setAssignments(prev => ({
      ...prev,
      [selectedShift]: shiftAssignments
    }));
  };

  // Save roster
  const saveRoster = async () => {
    setSaving(true);
    try {
      const payload = {
        year,
        week_number: week,
        leader_shift_1_id: leaderIds.shift_1,
        leader_shift_2_id: leaderIds.shift_2,
        leader_shift_3_id: leaderIds.shift_3,
        assignments,
        notes,
        status: 'draft'
      };
      
      let response;
      if (roster?.id) {
        response = await axiosInstance.put(`/api/hr/work-roster/rosters/${roster.id}`, payload);
      } else {
        response = await axiosInstance.post('/api/hr/work-roster/rosters', payload);
      }
      
      if (response.data.success) {
        toast.success('Roster berhasil disimpan');
        fetchRoster();
      } else {
        toast.error(response.data.error || 'Gagal menyimpan roster');
      }
    } catch (error: any) {
      console.error('Error saving roster:', error);
      toast.error(error.response?.data?.error || 'Gagal menyimpan roster');
    } finally {
      setSaving(false);
    }
  };

  // Publish roster
  const publishRoster = async () => {
    if (!roster?.id) {
      toast.error('Simpan roster terlebih dahulu');
      return;
    }
    
    try {
      const response = await axiosInstance.put(`/api/hr/work-roster/rosters/${roster.id}`, {
        status: 'published'
      });
      
      if (response.data.success) {
        toast.success('Roster berhasil dipublish');
        fetchRoster();
      }
    } catch (error) {
      toast.error('Gagal mempublish roster');
    }
  };

  // Navigate weeks
  const navigateWeek = (weeks: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setCurrentDate(newDate);
  };

  // Get assignments for a specific machine in current shift
  const getAssignmentsForMachine = (role: string, machineId: number) => {
    const shiftAssignments = assignments[selectedShift as keyof typeof assignments] || {};
    return (shiftAssignments[role] || []).filter(a => a.machine_id === machineId);
  };

  // Get general assignments (not machine-specific) in current shift
  const getGeneralAssignments = (role: string) => {
    const shiftAssignments = assignments[selectedShift as keyof typeof assignments] || {};
    return (shiftAssignments[role] || []).filter(a => !a.machine_id);
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${weekStart.toLocaleDateString('id-ID', options)} - ${weekEnd.toLocaleDateString('id-ID', options)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Roster Mingguan</h1>
          <p className="text-gray-600">Pengaturan jadwal kerja produksi per minggu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchRoster()}
            className="px-3 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={saveRoster}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          {roster?.id && roster.status === 'draft' && (
            <button
              onClick={publishRoster}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircleIcon className="h-5 w-5 inline mr-1" />
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                Minggu ke-{week} / {year}
              </span>
            </div>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-lg font-medium text-gray-700">
            {formatDateRange()}
          </div>

          {/* Status Badge */}
          {roster && (
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
              roster.status === 'published' 
                ? 'bg-green-100 text-green-800'
                : roster.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {roster.status === 'published' ? 'Published' : roster.status === 'completed' ? 'Completed' : 'Draft'}
            </span>
          )}
        </div>
      </div>

      {/* Shift Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b">
          <div className="flex">
            {SHIFTS.map(shift => (
              <button
                key={shift.value}
                onClick={() => setSelectedShift(shift.value)}
                className={`flex-1 px-6 py-4 text-center font-medium transition border-b-2 ${
                  selectedShift === shift.value
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  {shift.shortLabel}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Leader: {leaderIds[shift.value as keyof typeof leaderIds] 
                    ? (shift.value === 'shift_1' ? roster?.leader_shift_1_name : 
                       shift.value === 'shift_2' ? roster?.leader_shift_2_name : 
                       roster?.leader_shift_3_name) || 'Assigned'
                    : 'Belum ditentukan'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data roster...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Leader Section for current shift */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5" />
                Leader {SHIFTS.find(s => s.value === selectedShift)?.shortLabel}
              </h3>
              <select
                value={leaderIds[selectedShift as keyof typeof leaderIds] || ''}
                onChange={(e) => setLeaderIds(prev => ({
                  ...prev,
                  [selectedShift]: e.target.value ? parseInt(e.target.value) : null
                }))}
                className="border rounded-lg px-3 py-2 w-64"
              >
                <option value="">-- Pilih Leader --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Machine-based Assignments */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CogIcon className="h-5 w-5 text-blue-600" />
                Assignment per Mesin - {SHIFTS.find(s => s.value === selectedShift)?.shortLabel}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-40 border-r">Mesin</th>
                      {Object.entries(roleDefinitions)
                        .filter(([_, def]) => def.requires_machine)
                        .map(([role, def]) => (
                          <th key={role} className="px-4 py-3 text-left text-sm font-semibold border-r last:border-r-0" style={{ color: def.color }}>
                            {def.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {machines.map(machine => (
                      <tr key={machine.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 border-r bg-gray-50">
                          {machine.name}
                          <div className="text-xs text-gray-500">{machine.code}</div>
                        </td>
                        {Object.entries(roleDefinitions)
                          .filter(([_, def]) => def.requires_machine)
                          .map(([role, def]) => {
                            const roleAssignments = getAssignmentsForMachine(role, machine.id);
                            const RoleIcon = ROLE_ICONS[role] || UserIcon;
                            
                            return (
                              <td key={role} className="px-4 py-3 border-r last:border-r-0">
                                <div className="space-y-1">
                                  {roleAssignments.map((assignment, idx) => (
                                    <div 
                                      key={idx}
                                      className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-sm"
                                    >
                                      <RoleIcon className="h-4 w-4 flex-shrink-0" style={{ color: def.color }} />
                                      <span className="flex-1 truncate text-xs">{assignment.employee_name}</span>
                                      <button
                                        onClick={() => {
                                          const shiftAssigns = assignments[selectedShift as keyof typeof assignments] || {};
                                          const allRoleAssignments = shiftAssigns[role] || [];
                                          const actualIndex = allRoleAssignments.findIndex(
                                            a => a.employee_id === assignment.employee_id && a.machine_id === machine.id
                                          );
                                          if (actualIndex >= 0) removeAssignment(role, actualIndex);
                                        }}
                                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                                      >
                                        <TrashIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => openEmployeeModal(role, machine.id)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                    Tambah
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Assignments (Non-machine specific) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Assignment Umum - {SHIFTS.find(s => s.value === selectedShift)?.shortLabel}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(roleDefinitions)
                  .filter(([_, def]) => !def.requires_machine)
                  .map(([role, def]) => {
                    const roleAssignments = getGeneralAssignments(role);
                    const RoleIcon = ROLE_ICONS[role] || UserIcon;
                    
                    return (
                      <div key={role} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: def.color }}>
                          <RoleIcon className="h-5 w-5" />
                          {def.name}
                        </h4>
                        
                        <div className="space-y-2">
                          {roleAssignments.map((assignment, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded text-sm"
                            >
                              <span className="flex-1 truncate">{assignment.employee_name}</span>
                              <button
                                onClick={() => {
                                  const shiftAssigns = assignments[selectedShift as keyof typeof assignments] || {};
                                  const allRoleAssignments = shiftAssigns[role] || [];
                                  const actualIndex = allRoleAssignments.findIndex(
                                    a => a.employee_id === assignment.employee_id && !a.machine_id
                                  );
                                  if (actualIndex >= 0) removeAssignment(role, actualIndex);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => openEmployeeModal(role, null)}
                            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded px-3 py-2 text-gray-600 hover:border-blue-400 hover:text-blue-600 text-sm"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Tambah
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Catatan</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan untuk roster minggu ini..."
                className="w-full border rounded-lg px-3 py-2 h-20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Employee Selection Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Pilih Karyawan - {roleDefinitions[currentRole]?.name || currentRole}
                {currentMachineId && ` (${machines.find(m => m.id === currentMachineId)?.name})`}
              </h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  fetchEmployees();
                }}
                placeholder="Cari nama atau NIK..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Tidak ada karyawan ditemukan
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">NIK</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nama</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Departemen</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{emp.employee_number}</td>
                        <td className="px-4 py-2 text-sm font-medium">{emp.full_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{emp.department || '-'}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => addEmployee(emp)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Pilih
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
