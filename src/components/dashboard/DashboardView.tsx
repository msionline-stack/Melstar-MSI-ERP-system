import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  UtensilsCrossed,
  Coins,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { getTodayGmtIso, formatGmtDate } from '../../utils/dateUtils';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenCollectPayment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenCollectPayment }) => {
  const { canViewFinancials } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Academic Term');
  const [selectedDate, setSelectedDate] = useState('2026-10-09');

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(selectedDate, dateRange);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedDate, dateRange]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Calculating Melstar ERP metrics...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Executive Management Overview
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Melstar Children Training Centre
          </h2>
          <p className="text-xs text-slate-500">
            Real-time calculations from student, attendance, feeding, fee obligation &amp; payment records
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {['Today', 'Yesterday', 'This Week', 'This Month', 'Academic Term'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setDateRange(range);
                if (range === 'Today') {
                  setSelectedDate(getTodayGmtIso());
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                dateRange === range
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {range === 'Today' ? 'Today (GMT)' : range}
            </button>
          ))}
          <div className="flex items-center bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-200 text-xs space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden"
              title="Filter by date in GMT"
            />
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200">
              GMT
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Attendance & Core Counts) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enrolled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalEnrolled}</span>
            <span className="text-[11px] font-bold text-slate-500">Active Students</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Nursery to Basic 6</div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Present</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{stats.studentsPresentToday}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.attendancePercentage}% Rate
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">{stats.studentsLateToday} arrived late</div>
        </div>

        {/* Absent Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Absent</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{stats.studentsAbsentToday}</span>
            <span className="text-[11px] font-semibold text-rose-600">
              {stats.totalEnrolled > 0
                ? ((stats.studentsAbsentToday / stats.totalEnrolled) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Absence follow-up active</div>
        </div>

        {/* Feeding Surplus/Deficit Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Feeding Surplus / Deficit</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stats.netFeedingSurplusToday >= 0
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-black font-mono ${
                stats.netFeedingSurplusToday >= 0 ? 'text-teal-700' : 'text-amber-700'
              }`}
            >
              GH₵ {stats.netFeedingSurplusToday.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Collected: GH₵ {stats.feedingFeesCollectedToday.toFixed(0)} • Cost: GH₵ {stats.feedingExpensesToday.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Financial KPIs (Only visible if user has financial privileges) */}
      {canViewFinancials ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Total Collected Today */}
          <div className="bg-linear-to-br from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-md border border-emerald-700">
            <div className="flex items-center justify-between text-emerald-200">
              <span className="text-xs font-bold uppercase tracking-wider">Total Collected Today</span>
              <CreditCard className="w-4 h-4 text-amber-300" />
            </div>
            <div className="mt-3 text-3xl font-black font-mono tracking-tight text-white">
              GH₵ {stats.totalCollectedToday.toFixed(2)}
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-700/60 flex justify-between text-xs text-emerald-100">
              <span>Expected: GH₵ {stats.totalExpectedToday.toFixed(2)}</span>
              <span className="font-bold text-amber-300">
                {stats.totalExpectedToday > 0
                  ? ((stats.totalCollectedToday / stats.totalExpectedToday) * 100).toFixed(0)
                  : 0}
                % collected
              </span>
            </div>
          </div>

          {/* Feeding Fees Collected Today */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Feeding Fees Today
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <UtensilsCrossed className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black font-mono text-slate-900">
              GH₵ {stats.feedingFeesCollectedToday.toFixed(2)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
              <span>Outstanding: GH₵ {stats.outstandingFeedingToday.toFixed(2)}</span>
              <span className="text-emerald-700 font-semibold">Daily &amp; Weekly</span>
            </div>
          </div>

          {/* Class Fees Collected Today */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Class Fees Today
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black font-mono text-slate-900">
              GH₵ {stats.classFeesCollectedToday.toFixed(2)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
              <span>This Week: GH₵ {stats.totalCollectionsThisWeek.toFixed(2)}</span>
              <span className="text-indigo-600 font-semibold">Tuition</span>
            </div>
          </div>

          {/* Outstanding Student Balances */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Total Outstanding Arrears
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black font-mono text-rose-700">
              GH₵ {stats.totalOutstandingBalances.toFixed(2)}
            </div>
            <div className="mt-3 pt-3 border-t border-rose-100 flex justify-between text-xs text-rose-600">
              <span>This Month: GH₵ {stats.totalCollectionsThisMonth.toFixed(2)}</span>
              <button
                onClick={() => onNavigate('outstanding')}
                className="font-bold underline hover:text-rose-800 cursor-pointer"
              >
                View List &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Financial summary is restricted for your assigned role.</span>
          <span className="font-semibold text-slate-700">Academic &amp; Attendance views available</span>
        </div>
      )}

      {/* Quick Action Shortcuts Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick Action Shortcuts
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">One-click operational triggers</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <UserCheck className="w-4 h-4 mb-1 text-emerald-400" />
            Mark Attendance
          </button>
          <button
            onClick={onOpenCollectPayment}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <CreditCard className="w-4 h-4 mb-1 text-amber-400" />
            Record Payment
          </button>
          <button
            onClick={() => onNavigate('feeding-daily')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <UtensilsCrossed className="w-4 h-4 mb-1 text-teal-400" />
            Daily Feeding
          </button>
          <button
            onClick={() => onNavigate('students')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <Users className="w-4 h-4 mb-1 text-blue-400" />
            Register Student
          </button>
          <button
            onClick={() => onNavigate('feeding-expenses')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <ShoppingBag className="w-4 h-4 mb-1 text-pink-400" />
            Feeding Expenses
          </button>
          <button
            onClick={() => onNavigate('outstanding')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <AlertTriangle className="w-4 h-4 mb-1 text-rose-400" />
            Outstanding Fees
          </button>
          <button
            onClick={() => onNavigate('daily-closing')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <CheckCircle2 className="w-4 h-4 mb-1 text-sky-400" />
            Daily Closing
          </button>
          <button
            onClick={() => onNavigate('weekly-report')}
            className="p-2.5 bg-slate-800 hover:bg-emerald-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center"
          >
            <TrendingUp className="w-4 h-4 mb-1 text-indigo-400" />
            Weekly Report
          </button>
        </div>
      </div>

      {/* Analytics & Comparisons Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Collections Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Daily Collections Trend</h3>
              <p className="text-xs text-slate-500">Feeding Fees vs Class Fees (Term 1, Week 5)</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
              Total Week: GH₵ {stats.totalCollectionsThisWeek.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            {stats.dailyCollectionsTrend.map((t, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{t.day} ({t.date})</span>
                  <span className="font-mono font-bold text-slate-900">
                    GH₵ {t.total.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, (t.feeding / 700) * 100)}%` }}
                    className="bg-amber-500 h-full"
                    title={`Feeding: GH₵ ${t.feeding}`}
                  />
                  <div
                    style={{ width: `${Math.min(100, (t.classFee / 700) * 100)}%` }}
                    className="bg-indigo-600 h-full"
                    title={`Class Fee: GH₵ ${t.classFee}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Feeding: GH₵ {t.feeding.toFixed(2)}</span>
                  <span>Class Fee: GH₵ {t.classFee.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center space-x-6 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
              <span>Feeding Fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-xs bg-indigo-600"></span>
              <span>Class Fees</span>
            </div>
          </div>
        </div>

        {/* Attendance by Class */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance by Class Today</h3>
              <p className="text-xs text-slate-500">Present rate across all 9 levels</p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Open Register &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {stats.attendanceByClass.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 w-24 truncate">{c.className}</span>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.rate}%` }}
                      className={`h-full rounded-full ${
                        c.rate >= 90
                          ? 'bg-emerald-600'
                          : c.rate >= 75
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="font-bold text-slate-800">{c.rate}%</span>{' '}
                  <span className="text-[10px] text-slate-400">({c.present} / {c.present + c.absent})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Attendance: <strong className="text-slate-800">{stats.attendancePercentage}%</strong></span>
            <span>Target: <strong className="text-emerald-700">95%+</strong></span>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown & Feeding Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Today's Collections by Payment Method</h3>
          <p className="text-xs text-slate-500 mb-4">Cash vs Mobile Money (MTN MoMo, Vodafone Cash) &amp; Bank</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
              <div className="text-[11px] font-bold text-emerald-800">Cash Received</div>
              <div className="text-lg font-black font-mono text-emerald-900 mt-1">
                GH₵ {(stats.paymentMethods['Cash'] || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-center">
              <div className="text-[11px] font-bold text-amber-800">Mobile Money</div>
              <div className="text-lg font-black font-mono text-amber-900 mt-1">
                GH₵ {(stats.paymentMethods['Mobile Money'] || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
              <div className="text-[11px] font-bold text-blue-800">Bank / Card</div>
              <div className="text-lg font-black font-mono text-blue-900 mt-1">
                GH₵ {(stats.paymentMethods['Bank Transfer'] || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Feeding Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">Feeding Operation Financial Health</h3>
            <button
              onClick={() => onNavigate('feeding-expenses')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Log Expenses &rarr;
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">Weekly collections versus bulk procurement expenses</p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Weekly Feeding Fees Collected:</span>
              <span className="font-mono font-bold text-emerald-700">
                GH₵ {stats.feedingCollectedWeek.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Weekly Kitchen Food &amp; Gas Expenses:</span>
              <span className="font-mono font-bold text-rose-700">
                GH₵ {stats.feedingExpensesWeek.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-slate-900">
              <span>Net Feeding Operating Balance:</span>
              <span
                className={`font-mono ${
                  stats.netFeedingSurplusWeek >= 0 ? 'text-teal-700' : 'text-amber-700'
                }`}
              >
                GH₵ {stats.netFeedingSurplusWeek.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
