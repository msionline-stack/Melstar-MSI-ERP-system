import React, { useState, useEffect } from 'react';
import { DashboardStats, DailyClosing } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  Printer,
  Clock,
  Coins,
  UtensilsCrossed,
  UserCheck,
  CreditCard,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getTodayGmtIso, formatGmtTime } from '../../utils/dateUtils';

export const DailyOperationsView: React.FC = () => {
  const { canCloseDay, currentUser } = useAuth();
  const [date, setDate] = useState('2026-10-09');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [closingNotes, setClosingNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePrintClosing, setActivePrintClosing] = useState<DailyClosing | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashStats, clsList] = await Promise.all([
        api.getDashboardStats(date, 'Today'),
        api.getDailyClosings(),
      ]);
      setStats(dashStats);
      setClosings(clsList);
    } catch (err) {
      console.error('Failed to load operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const handleGenerateClosing = async () => {
    try {
      const res = await api.closeDay(date, closingNotes);
      setActivePrintClosing(res.closing);
      loadData();
      alert(`Daily Closing Report generated and locked for ${date}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to generate closing');
    }
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Operations Desk &amp; Closing Reconciliation
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Daily Operations Summary &amp; Closing
          </h2>
          <p className="text-xs text-slate-500">
            Morning readiness checklist, cashier balancing, and end-of-day locked management audit
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Date (GMT):</span>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent focus:outline-hidden"
                title="Operational audit date in GMT"
              />
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1 py-0.5 rounded border border-blue-200">
                GMT
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDate(getTodayGmtIso())}
              className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer border ${
                date === getTodayGmtIso()
                  ? 'bg-blue-800 text-white border-blue-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Set to today's date in GMT"
            >
              Today (GMT)
            </button>
          </div>
        </div>
      </div>

      {/* Operational Balancing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance & Class Registers Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <UserCheck className="w-4 h-4 mr-2 text-emerald-700" />
              Attendance Readiness ({date})
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {stats.attendancePercentage}% Completed
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500">Expected</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{stats.totalEnrolled}</div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <div className="text-[10px] text-emerald-800">Present</div>
              <div className="text-base font-bold text-emerald-800 mt-0.5">{stats.studentsPresentToday}</div>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              <div className="text-[10px] text-rose-800">Absent</div>
              <div className="text-base font-bold text-rose-800 mt-0.5">{stats.studentsAbsentToday}</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 pt-2">
            <div className="flex justify-between">
              <span>All 9 Class Registers:</span>
              <span className="font-semibold text-emerald-700">Submitted &amp; Verified</span>
            </div>
            <div className="flex justify-between">
              <span>Late Arrivals Logged:</span>
              <span className="font-semibold text-slate-800">{stats.studentsLateToday} students</span>
            </div>
          </div>
        </div>

        {/* Collections Balancing Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-blue-700" />
              Collections Reconciliation ({date})
            </h3>
            <span className="font-mono text-sm font-black text-emerald-800">
              GH₵ {stats.totalCollectedToday.toFixed(2)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Feeding Fees Collected Today:</span>
              <span className="font-mono font-bold text-slate-900">
                GH₵ {stats.feedingFeesCollectedToday.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Class Fees / Tuition Collected:</span>
              <span className="font-mono font-bold text-slate-900">
                GH₵ {stats.classFeesCollectedToday.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Cash in Till (Physical Float):</span>
              <span className="font-mono font-bold text-emerald-700">
                GH₵ {(stats.paymentMethods['Cash'] || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Mobile Money (MTN MoMo):</span>
              <span className="font-mono font-bold text-amber-700">
                GH₵ {(stats.paymentMethods['Mobile Money'] || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-rose-700 font-semibold">
              <span>Uncollected Balances Due Today:</span>
              <span className="font-mono font-bold">
                GH₵ {stats.totalOutstandingToday.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* End of Day Closing Action Box */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Generate End-of-Day Closing Report</h3>
            <p className="text-xs text-slate-400">
              Freezes today's collection counts, attendance records, and generates an official printable closing audit.
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
            Official Close
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            End of Day Discrepancy &amp; Operational Notes
          </label>
          <input
            type="text"
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="e.g. All physical cash tallied and locked in safe. MoMo statements reconciled with MTN wallet."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Authorized Administrator: <strong>{currentUser?.name}</strong>
          </span>
          <button
            onClick={handleGenerateClosing}
            disabled={!canCloseDay}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Lock &amp; Generate Daily Closing Report
          </button>
        </div>
      </div>

      {/* Historical Daily Closings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Historical Daily Closings Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date (GMT)</th>
                <th className="py-2.5 px-3">Attendance Rate</th>
                <th className="py-2.5 px-3 text-right">Feeding Collected</th>
                <th className="py-2.5 px-3 text-right">Class Fees</th>
                <th className="py-2.5 px-3 text-right">Cash Total</th>
                <th className="py-2.5 px-3 text-right">MoMo Total</th>
                <th className="py-2.5 px-3">Closed By (GMT)</th>
                <th className="py-2.5 px-3 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closings.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">{c.attendanceRate}%</td>
                  <td className="py-2.5 px-3 font-mono text-right font-semibold text-slate-800">
                    GH₵ {c.collectedFeeding.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right font-semibold text-slate-800">
                    GH₵ {c.collectedClassFees.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-emerald-800">
                    GH₵ {c.cashTotal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-amber-800">
                    GH₵ {c.momoTotal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 font-semibold">{c.closedByName}</div>
                    {c.closedAt && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatGmtTime(c.closedAt)}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setActivePrintClosing(c);
                        setTimeout(() => window.print(), 200);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition cursor-pointer flex items-center ml-auto"
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Print
                    </button>
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
