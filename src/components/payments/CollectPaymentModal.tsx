import React, { useState, useEffect } from 'react';
import { Student, Payment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  X,
  Search,
  CheckCircle2,
  DollarSign,
  Phone,
  FileText,
  User,
  ShieldAlert,
} from 'lucide-react';
import { ReceiptModal, ReceiptData } from '../common/ReceiptModal';
import { getTodayGmtIso } from '../../utils/dateUtils';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string;
  onPaymentSuccess?: () => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  onPaymentSuccess,
}) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  // Payment Form Fields (default to current GMT date)
  const [paymentDate, setPaymentDate] = useState(getTodayGmtIso());
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Allocation Amounts
  const [feedingAlloc, setFeedingAlloc] = useState<number>(10);
  const [tuitionAlloc, setTuitionAlloc] = useState<number>(0);
  const [arrearsAlloc, setArrearsAlloc] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getStudents({ status: 'Active' }).then((stus) => {
        setStudents(stus);
        if (preselectedStudentId) {
          const s = stus.find((stu) => stu.id === preselectedStudentId);
          if (s) {
            setSelectedStudent(s);
            loadProfile(s.id);
          }
        }
      });
    }
  }, [isOpen, preselectedStudentId]);

  const loadProfile = async (id: string) => {
    try {
      const p = await api.getStudentProfile(id);
      setStudentProfile(p);
      if (p.student.feedingArrangement === 'Daily') {
        setFeedingAlloc(10);
      } else if (p.student.feedingArrangement === 'Weekly') {
        setFeedingAlloc(50);
      } else {
        setFeedingAlloc(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectStudent = (stu: Student) => {
    setSelectedStudent(stu);
    loadProfile(stu.id);
  };

  const totalAmount = (feedingAlloc || 0) + (tuitionAlloc || 0) + (arrearsAlloc || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }
    if (totalAmount <= 0) {
      alert('Please enter an amount to collect');
      return;
    }

    setLoading(true);
    try {
      const allocations: any[] = [];
      if (feedingAlloc > 0) {
        allocations.push({
          feeCategoryId: 'FC-FEED',
          feeCategoryName: 'Feeding Fee',
          amountAllocated: feedingAlloc,
          periodRef: paymentDate,
        });
      }
      if (tuitionAlloc > 0) {
        allocations.push({
          feeCategoryId: 'FC-TUITION',
          feeCategoryName: 'Class Fee / Tuition',
          amountAllocated: tuitionAlloc,
          periodRef: '2026-Term-1',
        });
      }
      if (arrearsAlloc > 0) {
        allocations.push({
          feeCategoryId: 'FC-TUITION',
          feeCategoryName: 'Opening Arrears Clearance',
          amountAllocated: arrearsAlloc,
          periodRef: 'Previous Term',
        });
      }

      const res = await api.recordPayment({
        studentId: selectedStudent.id,
        totalAmount,
        paymentDate,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        notes: notes || undefined,
        allocations,
      });

      setReceiptData(res.receipt);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">Collect Student Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Step 1: Student Selection */}
          {!selectedStudent ? (
            <div>
              <label className="block text-slate-700 font-bold mb-2">
                Select Student for Payment Collection
              </label>
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {students
                  .filter((s) => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (
                      s.fullName.toLowerCase().includes(q) ||
                      s.admissionNumber.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {s.admissionNumber} • {s.className} • Parent: {s.parentPhone}
                        </div>
                      </div>
                      <span className="text-emerald-700 font-bold text-xs">Select &rarr;</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{selectedStudent.fullName}</div>
                <div className="text-slate-600 font-mono text-xs mt-0.5">
                  {selectedStudent.admissionNumber} • {selectedStudent.className} •{' '}
                  <span className="font-semibold text-emerald-800">
                    {selectedStudent.feedingArrangement} Feeding
                  </span>
                </div>
                {studentProfile && (
                  <div className="mt-1 text-[11px] text-rose-700 font-bold">
                    Current Outstanding Balance: GH₵ {studentProfile.totalOutstanding.toFixed(2)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentProfile(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Change Student
              </button>
            </div>
          )}

          {/* Step 2: Payment Allocations (Multi-category split) */}
          <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs">Fee Category Allocations</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Feeding Fee (GH₵)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={feedingAlloc}
                  onChange={(e) => setFeedingAlloc(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-400">Daily GH₵10 / Weekly GH₵50</span>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Class Fee / Tuition (GH₵)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={tuitionAlloc}
                  onChange={(e) => setTuitionAlloc(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-400">Term 1 Tuition</span>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Arrears Clearance (GH₵)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={arrearsAlloc}
                  onChange={(e) => setArrearsAlloc(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-400">Past terms balance</span>
              </div>
            </div>

            {/* Total Summary */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Amount to Collect:</span>
              <span className="text-xl font-black font-mono text-emerald-800">
                GH₵ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Step 3: Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="Cash">Cash (Cashier Desk)</option>
                <option value="Mobile Money">MTN Mobile Money</option>
                <option value="Mobile Money">Vodafone / Telecel Cash</option>
                <option value="Bank Transfer">Bank Transfer (GCB / Ecobank)</option>
                <option value="Card">Credit / Debit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Collection Date (GMT)</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Transaction Ref & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Transaction Reference / MoMo TxID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. MTN-299384729"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Cashier Notes</label>
              <input
                type="text"
                placeholder="e.g. Paid by father at assembly"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Cashier: <strong>{currentUser?.name}</strong> • Official receipt generated automatically
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedStudent || totalAmount <= 0}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                {loading ? 'Processing...' : `Confirm & Issue Receipt (GH₵ ${totalAmount.toFixed(2)})`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Official Receipt Popup */}
      <ReceiptModal
        receipt={receiptData}
        onClose={() => {
          setReceiptData(null);
          onClose();
        }}
      />
    </div>
  );
};
