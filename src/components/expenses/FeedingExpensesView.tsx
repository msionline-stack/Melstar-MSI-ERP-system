import React, { useState, useEffect } from 'react';
import { FeedingExpense } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Plus,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { getTodayGmtIso, formatGmtDate } from '../../utils/dateUtils';

export const FeedingExpensesView: React.FC = () => {
  const { canManageExpenses } = useAuth();
  const [expenses, setExpenses] = useState<FeedingExpense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newExpense, setNewExpense] = useState<Partial<FeedingExpense>>({
    date: getTodayGmtIso(),
    supplier: '',
    description: '',
    foodItems: '',
    quantity: '1',
    unitCost: 100,
    totalCost: 100,
    paymentMethod: 'Cash',
    receiptRef: '',
    approvalStatus: 'Approved',
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getFeedingExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load feeding expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addFeedingExpense(newExpense);
      setShowAddModal(false);
      loadExpenses();
      alert('Feeding expense recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const totalExpenseCost = expenses.reduce((s, e) => s + e.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-800">
              Kitchen Procurement &amp; Operational Costs
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Feeding Expenses &amp; Food Cost Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Log food market purchases, LPG cooking gas refills, and calculate meal cost per student
          </p>
        </div>

        {canManageExpenses && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Kitchen Expense
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Kitchen Expenses</div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            GH₵ {totalExpenseCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rice, fish, oil, gas, veggies &amp; water</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200/80 shadow-xs bg-teal-50/20">
          <div className="text-[11px] font-bold text-teal-800 uppercase">Average Daily Meal Cost</div>
          <div className="text-2xl font-black font-mono text-teal-700 mt-1">
            GH₵ {(totalExpenseCost / Math.max(1, expenses.length)).toFixed(2)}
          </div>
          <div className="text-[10px] text-teal-700 mt-0.5">Estimated GH₵ 6.80 per student present</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Recorded Procurement Bills</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {expenses.length} invoices
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified with market receipts</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date (GMT)</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Food Items &amp; Description</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4 text-right">Total Cost (GH₵)</th>
                <th className="py-3 px-4">Method &amp; Ref</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{e.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{e.supplier}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{e.foodItems}</div>
                    <div className="text-[10px] text-slate-500">{e.description}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{e.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    GH₵ {e.totalCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{e.paymentMethod}</div>
                    {e.receiptRef && (
                      <div className="text-[10px] text-slate-400 font-mono">Bill: {e.receiptRef}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{e.recordedByName}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {e.approvalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Kitchen Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Kitchen Feeding Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Expense Date (GMT)</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Comfort Agbo (Kaneshie Market)"
                    value={newExpense.supplier}
                    onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Food Items Purchased</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50kg Jasmine Rice, 1 Carton Fresh Mackerel, Fresh Tomatoes"
                  value={newExpense.foodItems}
                  onChange={(e) => setNewExpense({ ...newExpense, foodItems: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Quantity / Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 Bag, 25 Litres, 2 Cylinders"
                    value={newExpense.quantity}
                    onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total Cost (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newExpense.totalCost}
                    onChange={(e) => setNewExpense({ ...newExpense, totalCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money (MTN MoMo)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Receipt / Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-8831"
                    value={newExpense.receiptRef}
                    onChange={(e) => setNewExpense({ ...newExpense, receiptRef: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Purpose of purchase, e.g. Lunch for Friday jollof & chicken..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
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
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
