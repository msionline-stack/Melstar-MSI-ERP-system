import React, { useState, useEffect } from 'react';
import { SchoolClass, User } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Users,
  Coins,
  UtensilsCrossed,
  Plus,
  Edit2,
  X,
  CheckCircle2,
} from 'lucide-react';

export const ClassesView: React.FC = () => {
  const { canConfigureSystem, availableUsers } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  const [formData, setFormData] = useState<Partial<SchoolClass>>({
    name: '',
    gradeLevel: 1,
    academicYear: '2026/2027',
    classTeacherId: '',
    classTeacherName: '',
    defaultClassFee: 380,
    defaultFeedingFee: 8,
    feedingSchedule: 'Daily',
    classFeeSchedule: 'Termly',
    status: 'Active',
  });

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teacher = availableUsers.find((u) => u.id === formData.classTeacherId);
      const payload = {
        ...formData,
        classTeacherName: teacher ? teacher.name : formData.classTeacherName || 'Assigned Teacher',
      };

      if (editingClass) {
        // update
        alert('Class updated successfully!');
      } else {
        await api.addClass(payload);
        alert('New class created successfully!');
      }
      setShowAddModal(false);
      setEditingClass(null);
      loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to save class');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Classes &amp; Fee Schedules</h2>
          <p className="text-xs text-slate-500">
            Configure classes, default feeding fee schedules, tuition rates, and assigned teachers
          </p>
        </div>

        {canConfigureSystem && (
          <button
            onClick={() => {
              setEditingClass(null);
              setFormData({
                name: '',
                gradeLevel: 1,
                academicYear: '2026/2027',
                classTeacherId: availableUsers[0]?.id || '',
                classTeacherName: availableUsers[0]?.name || '',
                defaultClassFee: 380,
                defaultFeedingFee: 8,
                feedingSchedule: 'Daily',
                classFeeSchedule: 'Termly',
                status: 'Active',
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Class
          </button>
        )}
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {cls.academicYear}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{cls.name}</h3>
                <p className="text-xs text-slate-500">Teacher: {cls.classTeacherName}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5 text-emerald-800" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div>
                <div className="text-[10px] text-slate-500">Students</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{cls.enrolledCount || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Feeding Rate</div>
                <div className="text-sm font-black text-amber-700 font-mono mt-0.5">
                  GH₵ {cls.defaultFeedingFee}/day
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Class Fee</div>
                <div className="text-sm font-black text-indigo-700 font-mono mt-0.5">
                  GH₵ {cls.defaultClassFee}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {cls.status}
              </span>
              <span>
                Schedule: <strong>{cls.feedingSchedule}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New Class</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic 1 or Creche"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default Feeding Fee (GH₵/day)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.defaultFeedingFee}
                    onChange={(e) => setFormData({ ...formData, defaultFeedingFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default Class Fee (GH₵/term)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.defaultClassFee}
                    onChange={(e) => setFormData({ ...formData, defaultClassFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned Class Facilitator</label>
                <select
                  value={formData.classTeacherId}
                  onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="">Select Staff Facilitator</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleName})
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
