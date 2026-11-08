import React, { useState, useEffect } from 'react';
import { DailyFeedingRow, SchoolClass } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ReceiptModal, ReceiptData } from '../common/ReceiptModal';
import { getTodayGmtIso } from '../../utils/dateUtils';

interface DailyFeedingViewProps {
  onOpenCollectPayment?: (studentId?: string) => void;
}

export const DailyFeedingView: React.FC<DailyFeedingViewProps> = () => {
  const { canCollectPayment, currentUser } = useAuth();
  const [date, setDate] = useState('2026-10-09');
  const [selectedClass, setSelectedClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [rows, setRows] = useState<DailyFeedingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedData, cls] = await Promise.all([
        api.getDailyFeeding(date, selectedClass !== 'all' ? selectedClass : undefined),
        api.getClasses(),
      ]);
      setRows(feedData);
      setClasses(cls);
    } catch (err) {
      console.error('Failed to load daily feeding register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date, selectedClass]);

  // Quick 1-click Pay Daily Feeding Fee (e.g. GH₵ 8.00)
  const handleQuickPay = async (row: DailyFeedingRow, method: 'Cash' | 'Mobile Money' = 'Cash') => {
    try {
      const result = await api.recordPayment({
        studentId: row.studentId,
        totalAmount: row.feeDue,
        paymentDate: date,
        paymentMethod: method,
        notes: `Daily feeding fee collection for ${date}`,
        allocations: [
          {
            feeCategoryId: 'FC-FEED',
            feeCategoryName: 'Feeding Fee',
            amountAllocated: row.feeDue,
            periodRef: date,
          },
        ],
      });

      setActiveReceipt(result.receipt);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  // Filter rows by search and status
  const filteredRows = rows.filter((r) => {
    if (statusFilter !== 'all' && r.paymentStatus !== statusFilter) return false;
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

  // Totals
  const totalExpected = rows.reduce((s, r) => s + r.feeDue, 0);
  const totalCollected = rows.reduce((s, r) => s + r.amountPaid, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const paidCount = rows.filter((r) => r.paymentStatus === 'Paid' || r.paymentStatus === 'Weekly Covered').length;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Kitchen Operations &amp; Feeding Register
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Daily Feeding Fee Collection
          </h2>
          <p className="text-xs text-slate-500">
            Monitor daily lunch payments, outstanding lunch fees, and fast collection desk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Date (GMT):</span>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                title="Feeding collection date in GMT"
              />
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded border border-amber-200">
                GMT
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDate(getTodayGmtIso())}
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer border ${
                date === getTodayGmtIso()
                  ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Set to today's date in GMT"
            >
              Today (GMT)
            </button>
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
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

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Expected Feeding</div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            GH₵ {totalExpected.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Based on scheduled feeding rate</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Feeding Collected</div>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            GH₵ {totalCollected.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            {paidCount} of {rows.length} students covered
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Uncollected Balance</div>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1">
            GH₵ {totalOutstanding.toFixed(2)}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">Requires cashier follow-up</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Collection Efficiency</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Target: 100% daily lunch recovery</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, admission no, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Weekly Covered">Weekly Covered</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Exempt">Exempt</option>
          </select>
        </div>
      </div>

      {/* Daily Feeding Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4 text-right">Fee Due</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4">Receipt / Method</th>
                <th className="py-3 px-4 text-right">Instant Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.studentId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{row.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                      {row.admissionNumber} • {row.feedingArrangement}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{row.className}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.attendanceStatus === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.attendanceStatus === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : row.attendanceStatus === 'Absent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.attendanceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    GH₵ {row.feeDue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    GH₵ {row.amountPaid.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    GH₵ {row.outstanding.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.paymentStatus === 'Weekly Covered'
                          ? 'bg-teal-100 text-teal-800'
                          : row.paymentStatus === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-800'
                          : row.paymentStatus === 'Exempt'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {row.receiptNumber !== '-' ? (
                      <div>
                        <div className="font-mono text-[10px] text-emerald-800 font-bold">
                          {row.receiptNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.paymentMethod} • {row.collectorName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.paymentStatus === 'Unpaid' && canCollectPayment ? (
                      <div className="inline-flex space-x-1">
                        <button
                          onClick={() => handleQuickPay(row, 'Cash')}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition cursor-pointer shadow-xs"
                          title={`Record Cash Payment GH₵ ${row.feeDue.toFixed(2)}`}
                        >
                          Cash Pay
                        </button>
                        <button
                          onClick={() => handleQuickPay(row, 'Mobile Money')}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition cursor-pointer shadow-xs"
                          title={`Record MoMo Payment GH₵ ${row.feeDue.toFixed(2)}`}
                        >
                          MoMo
                        </button>
                      </div>
                    ) : row.paymentStatus === 'Paid' ? (
                      <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Cleared
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Covered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal */}
      <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
    </div>
  );
};
