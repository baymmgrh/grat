import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, User, 
  CheckCircle, XCircle, AlertTriangle, Loader2, FileText
} from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  worked_hours: number;
  notes: string | null;
  attendee_name?: string;
}

interface LeaveEvent {
  id: number;
  title: string;
  staff_name: string;
  leave_type: string;
  start: string;
  end: string;
  color: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  attendances: AttendanceRecord[];
  leaves: LeaveEvent[];
}

const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showModal, setShowModal] = useState(false);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      // Fetch attendance report
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const [attendanceRes, leaveRes] = await Promise.all([
        axiosInstance.get('/api/attendance/report', {
          params: { start_date: startDate, end_date: endDate, per_page: 1000 }
        }),
        axiosInstance.get('/api/staff-leave/calendar', {
          params: { year, month }
        })
      ]);

      setAttendanceData(attendanceRes.data.records || []);
      setLeaveData(leaveRes.data.events || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Find attendances for this day
      const dayAttendances = attendanceData.filter(a => a.attendance_date === dateStr);
      
      // Find leaves that overlap with this day
      const dayLeaves = leaveData.filter(l => {
        const start = new Date(l.start);
        const end = new Date(l.end);
        return current >= start && current <= end;
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        attendances: dayAttendances,
        leaves: dayLeaves
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentDate, attendanceData, leaveData]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'late': return 'bg-yellow-500';
      case 'absent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const extractName = (record: AttendanceRecord) => {
    if (record.attendee_name) return record.attendee_name;
    if (record.notes && record.notes.includes('[NAME:')) {
      const match = record.notes.match(/\[NAME:([^\]]+)\]/);
      return match ? match[1] : 'Unknown';
    }
    return 'Unknown';
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.attendances.length > 0 || day.leaves.length > 0) {
      setSelectedDay(day);
      setShowModal(true);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Kalender Kehadiran
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Day Names */}
            <div className="grid grid-cols-7 border-b">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-24 p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                    !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                  } ${day.isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isToday ? 'text-blue-600' : ''
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Attendance indicators */}
                  {day.attendances.length > 0 && (
                    <div className="space-y-1">
                      {day.attendances.slice(0, 3).map((att, i) => (
                        <div
                          key={i}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            att.status === 'present' 
                              ? 'bg-green-100 text-green-700'
                              : att.status === 'late'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {extractName(att)}
                        </div>
                      ))}
                      {day.attendances.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{day.attendances.length - 3} lagi
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leave indicators */}
                  {day.leaves.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {day.leaves.slice(0, 2).map((leave, i) => (
                        <div
                          key={i}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ backgroundColor: leave.color + '20', color: leave.color }}
                        >
                          <FileText className="h-3 w-3 inline mr-1" />
                          {leave.staff_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-2">Keterangan:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Hadir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>Terlambat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Sakit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Izin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Cuti</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>Cuti Khusus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span>Dinas Luar</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {selectedDay.date.toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Attendances */}
              {selectedDay.attendances.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kehadiran ({selectedDay.attendances.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDay.attendances.map((att, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{extractName(att)}</p>
                            <p className="text-sm text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {att.clock_in ? new Date(att.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              {' → '}
                              {att.clock_out ? new Date(att.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </p>
                            {att.worked_hours > 0 && (
                              <p className="text-sm text-gray-500">
                                Jam kerja: {att.worked_hours.toFixed(1)} jam
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            att.status === 'present' 
                              ? 'bg-green-100 text-green-700'
                              : att.status === 'late'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {att.status === 'present' ? 'Hadir' : att.status === 'late' ? 'Terlambat' : att.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaves */}
              {selectedDay.leaves.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Izin/Cuti ({selectedDay.leaves.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDay.leaves.map((leave, i) => (
                      <div 
                        key={i} 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: leave.color + '10' }}
                      >
                        <p className="font-medium">{leave.staff_name}</p>
                        <p className="text-sm" style={{ color: leave.color }}>
                          {leave.title.split(' - ')[1]}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(leave.start).toLocaleDateString('id-ID')} - {new Date(leave.end).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
