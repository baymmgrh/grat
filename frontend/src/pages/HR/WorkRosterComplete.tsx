import { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CogIcon, 
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
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

interface Roster {
  id: number;
  roster_date: string;
  shift: string;
  leader_id: number | null;
  leader_name: string | null;
  status: string;
  notes: string | null;
  assignments: { [role: string]: Assignment[] };
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

export default function WorkRosterComplete() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('shift_1');
  const [roster, setRoster] = useState<Roster | null>(null);
  const [roleDefinitions, setRoleDefinitions] = useState<{ [key: string]: RoleDefinition }>({});
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state for new/edit
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<{ [role: string]: Assignment[] }>({});
  const [notes, setNotes] = useState('');
  
  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentMachineId, setCurrentMachineId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      const response = await axiosInstance.get('/api/hr/work-roster/rosters/by-date', {
        params: { date: selectedDate, shift: selectedShift }
      });
      
      if (response.data.success) {
        setRoleDefinitions(response.data.role_definitions || {});
        
        if (response.data.roster) {
          setRoster(response.data.roster);
          setLeaderId(response.data.roster.leader_id);
          setAssignments(response.data.roster.assignments || {});
          setNotes(response.data.roster.notes || '');
        } else {
          // Initialize empty roster
          setRoster(null);
          setLeaderId(null);
          const emptyAssignments: { [key: string]: Assignment[] } = {};
          Object.keys(response.data.role_definitions || {}).forEach(role => {
            emptyAssignments[role] = [];
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
  }, [selectedDate, selectedShift]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  // Fetch employees
  const fetchEmployees = async (role?: string, machineId?: number | null) => {
    try {
      const params: any = { 
        date: selectedDate, 
        shift: selectedShift,
        search: searchTerm
      };
      if (role) params.role = role;
      if (machineId) params.machine_id = machineId;
      
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
    fetchEmployees(role, machineId);
  };

  // Add employee to role
  const addEmployee = (employee: Employee) => {
    const roleAssignments = [...(assignments[currentRole] || [])];
    
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
    
    setAssignments(prev => ({
      ...prev,
      [currentRole]: roleAssignments
    }));
    
    setShowEmployeeModal(false);
    toast.success(`${employee.full_name} ditambahkan ke ${roleDefinitions[currentRole]?.name || currentRole}`);
  };

  // Remove assignment
  const removeAssignment = (role: string, index: number) => {
    const roleAssignments = [...(assignments[role] || [])];
    roleAssignments.splice(index, 1);
    
    // Re-order positions
    roleAssignments.forEach((a, i) => {
      a.position = i + 1;
    });
    
    setAssignments(prev => ({
      ...prev,
      [role]: roleAssignments
    }));
  };

  // Save roster
  const saveRoster = async () => {
    setSaving(true);
    try {
      const payload = {
        roster_date: selectedDate,
        shift: selectedShift,
        leader_id: leaderId,
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

  // Copy roster
  const copyRoster = async (targetDate: string) => {
    try {
      const response = await axiosInstance.post('/api/hr/work-roster/rosters/copy', {
        source_date: selectedDate,
        target_date: targetDate,
        shift: selectedShift
      });
      
      if (response.data.success) {
        toast.success('Roster berhasil dicopy');
      } else {
        toast.error(response.data.error || 'Gagal copy roster');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal copy roster');
    }
  };

  // Navigate dates
  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Get assignments for a specific machine
  const getAssignmentsForMachine = (role: string, machineId: number) => {
    return (assignments[role] || []).filter(a => a.machine_id === machineId);
  };

  // Get general assignments (not machine-specific)
  const getGeneralAssignments = (role: string) => {
    return (assignments[role] || []).filter(a => !a.machine_id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Roster</h1>
          <p className="text-gray-600">Pengaturan jadwal kerja produksi</p>
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

      {/* Date & Shift Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-lg font-medium text-gray-700">
            {formatDate(selectedDate)}
          </div>

          {/* Shift Selector */}
          <div className="flex gap-2 ml-auto">
            {SHIFTS.map(shift => (
              <button
                key={shift.value}
                onClick={() => setSelectedShift(shift.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedShift === shift.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {shift.shortLabel}
              </button>
            ))}
          </div>

          {/* Status Badge */}
          {roster && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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

      {loading ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data roster...</p>
        </div>
      ) : (
        <>
          {/* Leader Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-purple-600" />
              Leader Shift
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={leaderId || ''}
                onChange={(e) => setLeaderId(e.target.value ? parseInt(e.target.value) : null)}
                className="border rounded-lg px-3 py-2 w-64"
              >
                <option value="">-- Pilih Leader --</option>
                {employees.filter(e => !e.is_assigned).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_number})
                  </option>
                ))}
              </select>
              {leaderId && (
                <span className="text-green-600 font-medium">
                  ✓ Leader: {employees.find(e => e.id === leaderId)?.full_name || roster?.leader_name}
                </span>
              )}
            </div>
          </div>

          {/* Machine-based Assignments */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CogIcon className="h-5 w-5 text-blue-600" />
              Assignment per Mesin
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-40">Mesin</th>
                    {Object.entries(roleDefinitions)
                      .filter(([_, def]) => def.requires_machine)
                      .map(([role, def]) => (
                        <th key={role} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          <span style={{ color: def.color }}>{def.name}</span>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {machines.map(machine => (
                    <tr key={machine.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {machine.name}
                        <div className="text-xs text-gray-500">{machine.code}</div>
                      </td>
                      {Object.entries(roleDefinitions)
                        .filter(([_, def]) => def.requires_machine)
                        .map(([role, def]) => {
                          const roleAssignments = getAssignmentsForMachine(role, machine.id);
                          const RoleIcon = ROLE_ICONS[role] || UserIcon;
                          
                          return (
                            <td key={role} className="px-4 py-3">
                              <div className="space-y-1">
                                {roleAssignments.map((assignment, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-sm"
                                  >
                                    <RoleIcon className="h-4 w-4" style={{ color: def.color }} />
                                    <span className="flex-1 truncate">{assignment.employee_name}</span>
                                    <button
                                      onClick={() => {
                                        const allRoleAssignments = assignments[role] || [];
                                        const actualIndex = allRoleAssignments.findIndex(
                                          a => a.employee_id === assignment.employee_id && a.machine_id === machine.id
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
                                  onClick={() => openEmployeeModal(role, machine.id)}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <PlusIcon className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(roleDefinitions)
              .filter(([_, def]) => !def.requires_machine)
              .map(([role, def]) => {
                const roleAssignments = getGeneralAssignments(role);
                const RoleIcon = ROLE_ICONS[role] || UserIcon;
                
                return (
                  <div key={role} className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: def.color }}>
                      <RoleIcon className="h-5 w-5" />
                      {def.name}
                    </h3>
                    
                    <div className="space-y-2">
                      {roleAssignments.map((assignment, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded"
                        >
                          <span className="flex-1">
                            {assignment.employee_name}
                            <span className="text-xs text-gray-500 ml-2">
                              ({assignment.employee_number})
                            </span>
                          </span>
                          <button
                            onClick={() => {
                              const allRoleAssignments = assignments[role] || [];
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
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Tambah {def.name}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Notes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Catatan</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk roster ini..."
              className="w-full border rounded-lg px-3 py-2 h-24"
            />
          </div>
        </>
      )}

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
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  fetchEmployees(currentRole, currentMachineId);
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
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map(emp => (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-gray-50 ${emp.is_assigned ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-2 text-sm">{emp.employee_number}</td>
                        <td className="px-4 py-2 text-sm font-medium">{emp.full_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{emp.department || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          {emp.is_assigned ? (
                            <span className="text-yellow-600">Sudah di-assign</span>
                          ) : emp.has_skill ? (
                            <span className="text-green-600">Tersedia</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => addEmployee(emp)}
                            disabled={emp.is_assigned}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
