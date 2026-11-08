import React, { useState, useEffect } from 'react';
import { WeeklyFeedingRow, SchoolClass } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Coins,
  TrendingUp,
} from 'lucide-react';

export const WeeklyFeedingView: React.FC = () => {
  const { canCollectPayment } = useAuth();
  const [weekRef, setWeekRef] = useState('2026-W41');
  const [selectedClass, setSelectedClass] = useState('all');
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [rows, setRows] = useState<WeeklyFeedingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wData, cls] = await Promise.all([
        api.getWeeklyFeeding(weekRef, selectedClass !== 'all' ? selectedClass : undefined),
        api.getClasses(),
      ]);
      setRows(wData);
      setClasses(cls);
    } catch (err) {
      console.error('Failed to load weekly feeding register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weekRef, selectedClass]);

  const filteredRows = rows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.admissionNumber.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Aggregates
  const totalWeeklyExpected = rows.reduce((s, r) => s + r.expectedWeeklyFee, 0);
  const totalWeeklyPaid = rows.reduce((s, r) => s + r.totalPaidWeekly, 0);
  const totalWeeklyOutstanding = rows.reduce((s, r) => s + r.outstandingBalance, 0);
  const recoveryRate = totalWeeklyExpected > 0 ? ((totalWeeklyPaid / totalWeeklyExpected) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Weekly Consolidation
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Weekly Feeding Fee Register
          </h2>
          <p className="text-xs text-slate-500">
            Compare expected weekly feeding collections (GH₵ 50/student) against actual payments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Week Selector */}
          <select
            value={weekRef}
            onChange={(e) => setWeekRef(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-hidden"
          >
            <option value="2026-W41">Week 41 (Oct 5 - Oct 9, 2026) - Current</option>
            <option value="2026-W40">Week 40 (Sep 28 - Oct 2, 2026)</option>
            <option value="2026-W39">Week 39 (Sep 21 - Sep 25, 2026)</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Expected Weekly</div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            GH₵ {totalWeeklyExpected.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 Feeding Days @ GH₵ 10</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200/80 shadow-xs bg-teal-50/20">
          <div className="text-[11px] font-bold text-teal-800 uppercase">Total Collected</div>
          <div className="text-2xl font-black font-mono text-teal-700 mt-1">
            GH₵ {totalWeeklyPaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-teal-700 font-medium mt-0.5">Recovery Rate: {recoveryRate}%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Outstanding Balance</div>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1">
            GH₵ {totalWeeklyOutstanding.toFixed(2)}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">Arrears across active students</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Students</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {rows.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Enrolled for Week 41</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student in weekly register..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Weekly Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Days Present / Absent</th>
                <th className="py-3 px-4 text-right">Expected (GH₵)</th>
                <th className="py-3 px-4 text-right">Paid (GH₵)</th>
                <th className="py-3 px-4 text-right">Outstanding (GH₵)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((r) => (
                <tr key={r.studentId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{r.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                      {r.admissionNumber} • {r.feedingArrangement}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{r.className}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-emerald-700">{r.daysPresent} present</span>{' '}
                    <span className="text-slate-400">/</span>{' '}
                    <span className="font-semibold text-rose-600">{r.daysAbsent} absent</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    GH₵ {r.expectedWeeklyFee.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                    GH₵ {r.totalPaidWeekly.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    GH₵ {r.outstandingBalance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.paymentStatus === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
