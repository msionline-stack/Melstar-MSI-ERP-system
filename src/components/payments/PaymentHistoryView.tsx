import React, { useState, useEffect } from 'react';
import { Payment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ReceiptModal, ReceiptData } from '../common/ReceiptModal';

export const PaymentHistoryView: React.FC = () => {
  const { canReversePayment } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Reversal Modal
  const [reversalTarget, setReversalTarget] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalLoading, setReversalLoading] = useState(false);

  // Active Receipt Preview Modal
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await api.getPayments({
        date: dateFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [dateFilter, statusFilter]);

  const handlePrintReceipt = (p: Payment) => {
    setActiveReceipt({
      receiptNumber: p.receiptNumber,
      schoolName: 'Melstar Children Training Centre',
      location: 'New Gbawe, Greater Accra, Ghana',
      motto: 'Solid Foundation, Bright Future',
      paymentDate: p.paymentDate,
      studentName: p.studentName,
      admissionNumber: p.studentId,
      className: p.className || 'Class',
      totalReceived: p.totalAmount,
      paymentMethod: p.paymentMethod,
      transactionRef: p.transactionRef || 'N/A',
      collectorName: p.collectorName,
      notes: p.notes,
      allocations: p.allocations.map((a) => ({
        feeCategoryName: a.feeCategoryName,
        amountAllocated: a.amountAllocated,
        periodRef: a.periodRef,
      })),
      outstandingBalanceAfterPayment: 0,
    });
  };

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget) return;
    if (!reversalReason.trim()) {
      alert('Please provide a valid justification for this transaction reversal.');
      return;
    }

    setReversalLoading(true);
    try {
      await api.reversePayment(reversalTarget.id, reversalReason);
      alert(`Payment ${reversalTarget.receiptNumber} successfully reversed with audit record.`);
      setReversalTarget(null);
      setReversalReason('');
      loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to reverse payment');
    } finally {
      setReversalLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.collectorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCollectedAmount = payments
    .filter((p) => p.status === 'Completed')
    .reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Audit &amp; Receipts
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Payment History &amp; Reconciled Receipts
          </h2>
          <p className="text-xs text-slate-500">
            Audit-protected collection journal with verified receipt reprinting and authorized reversals
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Filtered Collections</div>
          <div className="text-2xl font-black font-mono text-emerald-800">
            GH₵ {totalCollectedAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, receipt number, or cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Reversed">Reversed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date (GMT)</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Allocations Breakdown</th>
                <th className="py-3 px-4">Method &amp; Ref</th>
                <th className="py-3 px-4 text-right">Amount (GH₵)</th>
                <th className="py-3 px-4">Collector</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr
                  key={p.id}
                  className={`transition ${
                    p.status === 'Reversed' ? 'bg-rose-50/40 line-through opacity-70' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                    {p.receiptNumber}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    <div className="text-slate-800">{p.paymentDate}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.createdAt ? p.createdAt.substring(11, 16) + ' GMT' : 'GMT'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{p.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{p.className}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {p.allocations.map((a, i) => (
                        <div key={i} className="text-[10px] text-slate-600">
                          <span className="font-semibold text-slate-800">{a.feeCategoryName}:</span>{' '}
                          GH₵ {a.amountAllocated.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{p.paymentMethod}</div>
                    {p.transactionRef && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {p.transactionRef}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    GH₵ {p.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{p.collectorName}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex space-x-1.5">
                      <button
                        onClick={() => handlePrintReceipt(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center"
                        title="Reprint official receipt"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Receipt
                      </button>

                      {p.status === 'Completed' && canReversePayment && (
                        <button
                          onClick={() => setReversalTarget(p)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs transition cursor-pointer"
                          title="Authorized payment reversal"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorized Reversal Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-700 text-white px-6 py-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm">Authorized Transaction Reversal</h3>
            </div>

            <form onSubmit={handleConfirmReversal} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                You are about to reverse receipt{' '}
                <strong className="text-slate-900 font-mono">{reversalTarget.receiptNumber}</strong>{' '}
                for <strong className="text-slate-900">{reversalTarget.studentName}</strong> (GH₵{' '}
                {reversalTarget.totalAmount.toFixed(2)}).
              </p>
              <p className="text-rose-600 font-semibold">
                This action will restore the student's fee obligation balances and log a permanent audit record.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Required Justification / Audit Reason:
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Accidental duplicate cashier entry / Check returned by bank..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversalLoading || !reversalReason.trim()}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {reversalLoading ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Preview Modal */}
      <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
    </div>
  );
};
