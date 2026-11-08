import React, { useState, useEffect } from 'react';
import { Student, SchoolClass } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Coins,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

interface ClassFeesViewProps {
  onOpenCollectPayment?: (studentId: string) => void;
}

export const ClassFeesView: React.FC<ClassFeesViewProps> = ({ onOpenCollectPayment }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stus, cls] = await Promise.all([
        api.getStudents({ classId: selectedClass !== 'all' ? selectedClass : undefined }),
        api.getClasses(),
      ]);
      setStudents(stus);
      setClasses(cls);
    } catch (err) {
      console.error('Failed to load class fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const filteredStudents = students.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Academic Tuition &amp; Levies
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Class Fee &amp; Tuition Management
          </h2>
          <p className="text-xs text-slate-500">
            Termly instructional fees, opening arrears, custom payment arrangements &amp; scholarships
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (GH₵ {c.defaultClassFee}/term)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Class Fee Roster */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-right">Class Fee (GH₵)</th>
                <th className="py-3 px-4 text-right">Opening Balance (GH₵)</th>
                <th className="py-3 px-4">Parent Phone</th>
                <th className="py-3 px-4">Special Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu) => {
                const cls = classes.find((c) => c.id === stu.classId);
                const tuitionRate = stu.customClassFee ?? cls?.defaultClassFee ?? 2;

                return (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{stu.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        {stu.admissionNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{stu.className}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900">
                      GH₵ {tuitionRate.toFixed(2)}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {cls?.classFeeSchedule || 'Daily'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600">
                      GH₵ {stu.openingBalance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div>{stu.parentPhone || '—'}</div>
                      {stu.location && (
                        <div className="text-[10px] text-indigo-600 font-sans">
                          {stu.location}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">
                      {stu.adminNotes || 'Standard fee schedule'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {onOpenCollectPayment && (
                        <button
                          onClick={() => onOpenCollectPayment(stu.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          Collect Fee
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
