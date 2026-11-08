import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Coins,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react';

export const WeeklyReportView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats('2026-10-09', 'This Week').then((d) => {
      setStats(d);
      setLoading(false);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Top Header & Print Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Executive Governance &amp; Variance Analysis
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Weekly Management Report (Week 41)
          </h2>
          <p className="text-xs text-slate-500">
            For General Manager &amp; School Management • Monday 5 Oct to Friday 9 Oct 2026
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print Management Report
        </button>
      </div>

      {/* Printable Report Document Body */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm font-sans space-y-6 print:border-none print:shadow-none print:p-0">
        {/* School Report Letterhead */}
        <div className="border-b-2 border-emerald-800 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Melstar Children Training Centre
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              New Gbawe, Greater Accra, Ghana • "Solid Foundation, Bright Future"
            </p>
            <p className="text-xs font-bold text-emerald-800 mt-1 uppercase tracking-wider">
              Comprehensive Weekly Management &amp; Financial Audit Report
            </p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-800">Academic Year: 2026/2027</div>
            <div className="text-slate-600">Term 1 • Week 5 (Week 41)</div>
            <div className="text-slate-500 text-[11px]">Period: Oct 5 - Oct 9, 2026</div>
          </div>
        </div>

        {/* 1. Written Executive Summary & Variance Commentary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-700" />
            1. Executive Summary &amp; Management Observations
          </h3>
          <p className="text-slate-700 leading-relaxed">
            During Week 5, total weekly fee collections amounted to{' '}
            <strong className="text-slate-900 font-mono font-bold">
              GH₵ {stats.totalCollectionsThisWeek.toFixed(2)}
            </strong>
            , comprising <strong>GH₵ {stats.feedingCollectedWeek.toFixed(2)}</strong> in student feeding fees
            and <strong>GH₵ {(stats.totalCollectionsThisWeek - stats.feedingCollectedWeek).toFixed(2)}</strong> in
            termly tuition payments. Overall student attendance averaged{' '}
            <strong className="text-emerald-700 font-bold">{stats.attendancePercentage}%</strong> across all nine
            levels. All class registers were recorded by teachers on schedule.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Kitchen foodstuff and gas procurement expenses totaled{' '}
            <strong className="text-rose-700 font-mono font-bold">
              GH₵ {stats.feedingExpensesWeek.toFixed(2)}
            </strong>
            , resulting in an operational feeding balance of{' '}
            <strong className={`font-mono font-bold ${stats.netFeedingSurplusWeek >= 0 ? 'text-teal-700' : 'text-amber-700'}`}>
              GH₵ {stats.netFeedingSurplusWeek.toFixed(2)}
            </strong>
            . Bulk purchase of 50kg perfumed rice and 25L Frytol cooking oil was completed on Thursday to cover
            the next three weeks of school lunches.
          </p>
        </div>

        {/* 2. Key Weekly Financial Metrics Table */}
        <div>
          <h3 className="font-bold text-slate-900 text-xs uppercase mb-3">
            2. Weekly Financial Performance Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 text-[10px] font-bold uppercase">Total Week Collections</span>
              <div className="text-lg font-black font-mono text-emerald-900 mt-1">
                GH₵ {stats.totalCollectionsThisWeek.toFixed(2)}
              </div>
            </div>
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              <span className="text-amber-800 text-[10px] font-bold uppercase">Weekly Feeding Collections</span>
              <div className="text-lg font-black font-mono text-amber-900 mt-1">
                GH₵ {stats.feedingCollectedWeek.toFixed(2)}
              </div>
            </div>
            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200">
              <span className="text-rose-800 text-[10px] font-bold uppercase">Weekly Kitchen Expenses</span>
              <div className="text-lg font-black font-mono text-rose-900 mt-1">
                GH₵ {stats.feedingExpensesWeek.toFixed(2)}
              </div>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200">
              <span className="text-blue-800 text-[10px] font-bold uppercase">Net Feeding Surplus</span>
              <div className="text-lg font-black font-mono text-blue-900 mt-1">
                GH₵ {stats.netFeedingSurplusWeek.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Class Attendance & Outstanding Arrears Table */}
        <div>
          <h3 className="font-bold text-slate-900 text-xs uppercase mb-3">
            3. Class-by-Class Attendance &amp; Arrears Comparison
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-center">Attendance Rate</th>
                  <th className="py-2.5 px-3 text-center">Students Present</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Arrears (GH₵)</th>
                  <th className="py-2.5 px-3">Status Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.attendanceByClass.map((c, i) => {
                  const debt = stats.outstandingByClass.find((o) => o.className === c.className)?.amount || 0;
                  return (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.className}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{c.rate}%</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{c.present}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        GH₵ {debt.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {c.rate >= 90 ? 'Excellent' : 'Needs Follow-up'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Action Items & Signatures */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Priority Management Actions:</h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
              <li>Send WhatsApp / SMS payment reminders for students with overdue tuition balances.</li>
              <li>Reconcile Mobile Money wallet receipts with bank physical cash lodgments.</li>
              <li>Monitor KG 2 attendance following minor health-related absences reported this week.</li>
            </ul>
          </div>
          <div className="flex flex-col justify-end text-right">
            <div className="border-t border-slate-400 pt-2 w-3/4 ml-auto">
              <div className="font-bold text-slate-800">Mr. Michael Addo</div>
              <div className="text-[11px] text-slate-500">General Manager, Melstar Children Training Centre</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
