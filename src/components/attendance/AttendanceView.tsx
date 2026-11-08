import React, { useState, useEffect } from 'react';
import { SchoolClass, Student, AttendanceRecord } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Users,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { getTodayGmtIso } from '../../utils/dateUtils';

export const AttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('CLS-CRECHE');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-09');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<
      string,
      {
        status: AttendanceRecord['status'];
        arrivalTime?: string;
        notes?: string;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const cls = await api.getClasses();
        setClasses(cls);
        if (cls.length > 0 && (!selectedClassId || !cls.some((c) => c.id === selectedClassId))) {
          setSelectedClassId(cls[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchClasses();
  }, []);

  // Load students & existing attendance for selected class & date
  const loadClassAttendance = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setSavedSuccess(false);
    try {
      const [stus, existingRecords] = await Promise.all([
        api.getStudents({ classId: selectedClassId, status: 'Active' }),
        api.getAttendance(selectedDate, selectedClassId),
      ]);

      setStudents(stus);

      const newMap: Record<string, any> = {};
      stus.forEach((s) => {
        const existing = existingRecords.find((r) => r.studentId === s.id);
        if (existing) {
          newMap[s.id] = {
            status: existing.status,
            arrivalTime: existing.arrivalTime,
            notes: existing.notes,
          };
        } else {
          // Default unrecorded
          newMap[s.id] = {
            status: 'Present',
            arrivalTime: '07:45',
            notes: '',
          };
        }
      });
      setAttendanceMap(newMap);
    } catch (err) {
      console.error('Failed to load class attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassAttendance();
  }, [selectedClassId, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        arrivalTime: status === 'Present' ? '07:45' : status === 'Late' ? '08:20' : undefined,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s.id] = {
          ...updated[s.id],
          status: 'Present',
          arrivalTime: '07:45',
        };
      });
      return updated;
    });
  };

  const handleSaveRegister = async () => {
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        status: attendanceMap[s.id]?.status || 'Present',
        arrivalTime: attendanceMap[s.id]?.arrivalTime,
        notes: attendanceMap[s.id]?.notes,
      }));

      await api.saveAttendanceRegister(selectedDate, selectedClassId, records);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      alert('Attendance register saved! Daily feeding fee obligations synced.');
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance register');
    }
  };

  // Metrics
  const total = students.length;
  const presentCount = Object.values(attendanceMap).filter(
    (v) => v.status === 'Present' || v.status === 'Late'
  ).length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'Late').length;
  const rate = total > 0 ? ((presentCount / total) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Daily Attendance Register
          </h2>
          <p className="text-xs text-slate-500">
            Fast attendance roll call for teachers. Updates daily feeding fee expectations automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Date (GMT):</span>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                title="Date in GMT"
              />
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200">
                GMT
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayGmtIso())}
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer border ${
                selectedDate === getTodayGmtIso()
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Set to today's date in GMT"
            >
              Today (GMT)
            </button>
          </div>

          {/* Mark All Present Shortcut */}
          <button
            onClick={handleMarkAllPresent}
            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Mark All Present
          </button>

          {/* Save Register Button */}
          <button
            onClick={handleSaveRegister}
            className="inline-flex items-center px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Register
          </button>
        </div>
      </div>

      {/* Attendance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Total In Class</div>
            <div className="text-lg font-black text-slate-900">{total} students</div>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div>
            <div className="text-[10px] text-emerald-800 font-semibold uppercase">Present Rate</div>
            <div className="text-lg font-black text-emerald-700">{rate}% ({presentCount})</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-xs flex items-center justify-between bg-rose-50/20">
          <div>
            <div className="text-[10px] text-rose-800 font-semibold uppercase">Absent</div>
            <div className="text-lg font-black text-rose-600">{absentCount}</div>
          </div>
          <XCircle className="w-5 h-5 text-rose-500" />
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between bg-amber-50/20">
          <div>
            <div className="text-[10px] text-amber-800 font-semibold uppercase">Late Arrivals</div>
            <div className="text-lg font-black text-amber-600">{lateCount}</div>
          </div>
          <Clock className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Student Full Name</th>
                <th className="py-3 px-4 text-center">Status Selection</th>
                <th className="py-3 px-4">Arrival Time (GMT)</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stu, index) => {
                const currentStatus = attendanceMap[stu.id]?.status || 'Present';
                const currentNotes = attendanceMap[stu.id]?.notes || '';
                const arrival = attendanceMap[stu.id]?.arrivalTime || '';

                return (
                  <tr
                    key={stu.id}
                    className={`transition ${
                      currentStatus === 'Absent'
                        ? 'bg-rose-50/30'
                        : currentStatus === 'Late'
                        ? 'bg-amber-50/30'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {stu.admissionNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{stu.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Arrangement: {stu.feedingArrangement} Feeding
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'Present')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'Late')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'Late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'Absent')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'Excused')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'Excused'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {currentStatus === 'Present' || currentStatus === 'Late' ? (
                        <input
                          type="time"
                          value={arrival}
                          onChange={(e) =>
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [stu.id]: { ...prev[stu.id], arrivalTime: e.target.value },
                            }))
                          }
                          className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs font-mono"
                        />
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder={currentStatus === 'Absent' ? 'e.g. Sickness, travel...' : 'Optional notes'}
                        value={currentNotes}
                        onChange={(e) => handleNotesChange(stu.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs focus:outline-hidden"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer save strip */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Recorded by: <strong className="text-slate-800">{currentUser?.name}</strong> •{' '}
            <span>{presentCount} Present / {total} Total Students</span>
          </div>
          <button
            onClick={handleSaveRegister}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Attendance Register
          </button>
        </div>
      </div>
    </div>
  );
};
