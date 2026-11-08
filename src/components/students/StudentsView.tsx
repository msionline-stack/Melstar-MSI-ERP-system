import React, { useState, useEffect } from 'react';
import { Student, SchoolClass } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Receipt,
  FileText,
  AlertCircle,
  X,
  UserCheck,
  ChevronRight,
  MapPin,
} from 'lucide-react';

interface StudentsViewProps {
  onOpenCollectPaymentForStudent?: (studentId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = () => {
  const { canManageStudents, canViewFinancials } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeProfileStudent, setActiveProfileStudent] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form State
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    fullName: '',
    admissionNumber: '',
    gender: 'Male',
    dateOfBirth: '2019-01-01',
    classId: '',
    className: '',
    academicYear: '2026/2027',
    admissionDate: '2026-09-08',
    status: 'Active',
    parentName: '',
    parentPhone: '+233 ',
    altPhone: '',
    location: '',
    emergencyContact: '',
    feedingArrangement: 'Daily',
    openingBalance: 0,
    adminNotes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stus, cls] = await Promise.all([
        api.getStudents({
          classId: selectedClass !== 'all' ? selectedClass : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: search || undefined,
        }),
        api.getClasses(),
      ]);
      setStudents(stus);
      setClasses(cls);
      if (cls.length > 0 && !newStudent.classId) {
        setNewStudent((prev) => ({ ...prev, classId: cls[0].id, className: cls[0].name }));
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenProfile = async (studentId: string) => {
    setLoadingProfile(true);
    try {
      const data = await api.getStudentProfile(studentId);
      setActiveProfileStudent(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetClass = classes.find((c) => c.id === newStudent.classId);
      await api.addStudent({
        ...newStudent,
        className: targetClass ? targetClass.name : 'Basic 1',
      });
      setShowAddModal(false);
      loadData();
      alert('Student registered successfully! Fee obligations generated.');
    } catch (err: any) {
      alert(err.message || 'Failed to register student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Student Directory</h2>
          <p className="text-xs text-slate-500">
            Comprehensive student enrollment, feeding arrangements, and profiles ({students.length} students)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageStudents && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Register Student
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, admission number, or parent phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Transferred">Transferred</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4">Feeding Arrangement</th>
                {canViewFinancials && <th className="py-3 px-4 text-right">Opening Arrears</th>}
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {stu.admissionNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <button
                      onClick={() => handleOpenProfile(stu.id)}
                      className="text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer text-left"
                    >
                      {stu.fullName}
                    </button>
                    <div className="text-[10px] text-slate-400 font-normal">
                      DOB: {stu.dateOfBirth} • {stu.gender}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {stu.className}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="font-semibold text-slate-800">{stu.parentName || '—'}</div>
                    {stu.parentPhone && (
                      <div className="text-[10px] text-slate-500 font-mono flex items-center mt-0.5">
                        <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                        {stu.parentPhone}
                      </div>
                    )}
                    {stu.location && (
                      <div className="text-[10px] text-indigo-700 flex items-center mt-0.5 font-medium">
                        <MapPin className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                        {stu.location}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        stu.feedingArrangement === 'Daily'
                          ? 'bg-amber-100 text-amber-800'
                          : stu.feedingArrangement === 'Weekly'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {stu.feedingArrangement} Feeding
                    </span>
                  </td>
                  {canViewFinancials && (
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      GH₵ {stu.openingBalance.toFixed(2)}
                    </td>
                  )}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {stu.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenProfile(stu.id)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg transition cursor-pointer"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No student records found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Drawer / Modal */}
      {activeProfileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {activeProfileStudent.student.fullName}
                </h3>
                <p className="text-xs text-slate-400">
                  Admission No: {activeProfileStudent.student.admissionNumber} • {activeProfileStudent.student.className}
                </p>
              </div>
              <button
                onClick={() => setActiveProfileStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Attendance Rate</div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {activeProfileStudent.attendancePercentage}%
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Total Paid (Term 1)</div>
                  <div className="text-xl font-black font-mono text-slate-900 mt-1">
                    GH₵ {activeProfileStudent.totalPaid.toFixed(2)}
                  </div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-rose-700 text-[11px] font-semibold">Total Outstanding</div>
                  <div className="text-xl font-black font-mono text-rose-700 mt-1">
                    GH₵ {activeProfileStudent.totalOutstanding.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Bio & Contact Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 text-[10px]">Parent / Guardian</div>
                  <div className="font-bold text-slate-900">{activeProfileStudent.student.parentName || '—'}</div>
                  {activeProfileStudent.student.parentPhone && (
                    <div className="text-slate-600 font-mono text-xs mt-0.5 flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      {activeProfileStudent.student.parentPhone}
                    </div>
                  )}
                  {activeProfileStudent.student.location && (
                    <div className="text-indigo-700 text-xs mt-1 flex items-center font-medium">
                      <MapPin className="w-3 h-3 mr-1 text-indigo-500" />
                      Location: {activeProfileStudent.student.location}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Fee Schedule & Feeding</div>
                  <div className="font-bold text-emerald-800">
                    {activeProfileStudent.student.feedingArrangement} Feeding (GH₵ {(activeProfileStudent.student.customFeedingFee ?? 8).toFixed(2)}/day)
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mt-0.5">
                    Class Fee: GH₵ {(activeProfileStudent.student.customClassFee ?? 2).toFixed(2)}
                  </div>
                  {activeProfileStudent.student.adminNotes && (
                    <div className="mt-1 text-[11px] text-amber-800 italic">
                      Note: {activeProfileStudent.student.adminNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Obligations */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span>Fee Obligations</span>
                  <span className="text-[10px] text-slate-400 font-normal">Active obligations for current term</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Fee Category</th>
                        <th className="p-2">Period</th>
                        <th className="p-2 text-right">Amount Due</th>
                        <th className="p-2 text-right">Paid</th>
                        <th className="p-2 text-right">Balance</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeProfileStudent.obligations.map((o: any) => (
                        <tr key={o.id}>
                          <td className="p-2 font-medium">{o.feeCategoryName}</td>
                          <td className="p-2 text-slate-500">{o.periodRef}</td>
                          <td className="p-2 font-mono text-right">GH₵ {o.amountDue.toFixed(2)}</td>
                          <td className="p-2 font-mono text-right text-emerald-700">GH₵ {o.amountPaid.toFixed(2)}</td>
                          <td className="p-2 font-mono text-right font-bold text-rose-600">GH₵ {o.balance.toFixed(2)}</td>
                          <td className="p-2 text-center">
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-700">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Payment History */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Payment History &amp; Receipts</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Receipt No</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2">Collector</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeProfileStudent.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2 font-mono font-bold text-emerald-800">{p.receiptNumber}</td>
                          <td className="p-2 text-slate-600">{p.paymentDate}</td>
                          <td className="p-2 text-slate-600">{p.paymentMethod}</td>
                          <td className="p-2 font-mono font-bold text-right text-slate-900">
                            GH₵ {p.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-2 text-slate-500">{p.collectorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveProfileStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={newStudent.admissionNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
                    placeholder="MCTC/2026/045"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    placeholder="e.g. Yaw Osei Mensah"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Class</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({ ...newStudent, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                    placeholder="Mr./Mrs. Parent Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Parent Phone (Ghana)</label>
                  <input
                    type="text"
                    required
                    value={newStudent.parentPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                    placeholder="+233 24 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Residential Location</label>
                  <input
                    type="text"
                    value={newStudent.location || ''}
                    onChange={(e) => setNewStudent({ ...newStudent, location: e.target.value })}
                    placeholder="e.g. Mallam, Gbawe, Abaase"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Opening Arrears (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStudent.openingBalance}
                    onChange={(e) => setNewStudent({ ...newStudent, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Feeding Arrangement</label>
                <select
                  value={newStudent.feedingArrangement}
                  onChange={(e) => setNewStudent({ ...newStudent, feedingArrangement: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="Daily">Daily Feeding</option>
                  <option value="Weekly">Weekly Feeding</option>
                  <option value="Exempt">Exempt / Self-catered</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={newStudent.adminNotes}
                  onChange={(e) => setNewStudent({ ...newStudent, adminNotes: e.target.value })}
                  placeholder="Special fee arrangements, emergency contact, dietary restrictions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Save &amp; Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
