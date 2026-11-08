import React, { useState, useEffect } from 'react';
import { OutstandingReportRow, SchoolClass } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle,
  Search,
  Filter,
  Download,
  Phone,
  MessageSquare,
  Clock,
  Coins,
} from 'lucide-react';

interface OutstandingFeesViewProps {
  onOpenCollectPayment?: (studentId: string) => void;
}

export const OutstandingFeesView: React.FC<OutstandingFeesViewProps> = ({
  onOpenCollectPayment,
}) => {
  const [rows, setRows] = useState<OutstandingReportRow[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rep, cls] = await Promise.all([
        api.getOutstandingReport(selectedClass !== 'all' ? selectedClass : undefined),
        api.getClasses(),
      ]);
      setRows(rep);
      setClasses(cls);
    } catch (err) {
      console.error('Failed to load outstanding fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const filteredRows = rows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.admissionNumber.toLowerCase().includes(q) ||
        r.parentName.toLowerCase().includes(q) ||
        r.parentPhone.includes(q)
      );
    }
    return true;
  });

  const totalOutstanding = filteredRows.reduce((s, r) => s + r.totalOutstanding, 0);

  const handleExportCSV = () => {
    const headers = [
      'Admission No',
      'Student Name',
      'Class',
      'Parent Name',
      'Parent Phone',
      'Feeding Arrangement',
      'Opening Arrears (GHS)',
      'Total Outstanding (GHS)',
      'Days Overdue',
    ];
    const csvRows = [headers.join(',')];

    filteredRows.forEach((r) => {
      csvRows.push(
        [
          `"${r.admissionNumber}"`,
          `"${r.fullName}"`,
          `"${r.className}"`,
          `"${r.parentName}"`,
          `"${r.parentPhone}"`,
          `"${r.feedingArrangement}"`,
          r.openingBalance,
          r.totalOutstanding,
          r.daysOverdue,
        ].join(',')
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `melstar_outstanding_fees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Accounts Receivable &amp; Arrears
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Outstanding Student Fees &amp; Statements
          </h2>
          <p className="text-xs text-slate-500">
            Track unpaid feeding fees, class fee balances, aging arrears, and parent phone directory
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Arrears Owed</div>
            <div className="text-2xl font-black font-mono text-rose-700">
              GH₵ {totalOutstanding.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, admission no, parent name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
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

      {/* Outstanding Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Parent / Contact</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Current Outstanding</th>
                <th className="py-3 px-4 text-center">Aging (Days)</th>
                <th className="py-3 px-4 text-right">Follow-up Action</th>
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
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{r.parentName}</div>
                    <div className="text-slate-600 font-mono text-[11px] flex items-center mt-0.5">
                      <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                      {r.parentPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                    GH₵ {r.openingBalance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-700 text-sm">
                    GH₵ {r.totalOutstanding.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      {r.daysOverdue} days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex space-x-1.5">
                      <a
                        href={`tel:${r.parentPhone.replace(/\s+/g, '')}`}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center"
                        title="Call Parent"
                      >
                        <Phone className="w-3 h-3 mr-1 text-emerald-600" />
                        Call
                      </a>
                      {onOpenCollectPayment && (
                        <button
                          onClick={() => onOpenCollectPayment(r.studentId)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No outstanding fee balances found matching criteria. Excellent financial compliance!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
