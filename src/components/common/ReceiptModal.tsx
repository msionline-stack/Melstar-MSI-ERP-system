import React from 'react';
import { Printer, Download, CheckCircle, X } from 'lucide-react';

export interface ReceiptData {
  receiptNumber: string;
  schoolName: string;
  location: string;
  motto: string;
  paymentDate: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  parentName?: string;
  parentPhone?: string;
  totalReceived: number;
  paymentMethod: string;
  transactionRef?: string;
  collectorName: string;
  notes?: string;
  allocations: Array<{
    feeCategoryName: string;
    amountAllocated: number;
    periodRef?: string;
  }>;
  outstandingBalanceAfterPayment: number;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Action Toolbar (Hidden in print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Payment Processed Successfully</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="p-8 print:p-0 font-sans" id="printable-receipt">
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-800 pb-4 mb-5">
            <div className="flex items-center justify-center space-x-2.5 mb-2">
              <img
                src="/assets/aistudio/sda_338456d1.png"
                alt="ClassLedger Logo"
                className="w-12 h-12 object-contain rounded-xl bg-white p-0.5 border border-slate-200"
              />
              <div className="text-left">
                <div className="text-xs font-black tracking-wider text-blue-900 uppercase">ClassLedger</div>
                <div className="text-[10px] text-slate-500 font-semibold">Institutional Billing System</div>
              </div>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Melstar Children Training Centre
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              New Gbawe, Greater Accra, Ghana • Tel: +233 24 456 7890
            </p>
            <p className="text-[11px] italic font-semibold text-emerald-800 mt-1">
              "Solid Foundation, Bright Future"
            </p>
            <div className="mt-3 inline-block bg-slate-100 text-slate-800 px-3 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border border-slate-300">
              Official Payment Receipt
            </div>
          </div>

          {/* Receipt Meta & Student Info */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-slate-500 text-[11px]">Receipt No:</div>
              <div className="font-mono font-bold text-slate-900 text-sm">{receipt.receiptNumber}</div>
              <div className="mt-2 text-slate-500 text-[11px]">Payment Date (GMT):</div>
              <div className="font-semibold text-slate-800">{receipt.paymentDate} GMT</div>
              <div className="mt-2 text-slate-500 text-[11px]">Payment Method:</div>
              <div className="font-semibold text-slate-800">{receipt.paymentMethod}</div>
              {receipt.transactionRef && receipt.transactionRef !== 'N/A' && (
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ref: {receipt.transactionRef}</div>
              )}
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Student Name:</div>
              <div className="font-bold text-slate-900 text-sm">{receipt.studentName}</div>
              <div className="mt-2 text-slate-500 text-[11px]">Admission No:</div>
              <div className="font-mono font-semibold text-slate-800">{receipt.admissionNumber}</div>
              <div className="mt-2 text-slate-500 text-[11px]">Class:</div>
              <div className="font-semibold text-slate-800">{receipt.className}</div>
            </div>
          </div>

          {/* Fee Allocations Breakdown */}
          <div className="mb-5">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 bg-slate-100">
                  <th className="py-2 px-3 font-semibold">Fee Category</th>
                  <th className="py-2 px-3 font-semibold">Period / Description</th>
                  <th className="py-2 px-3 font-semibold text-right">Amount (GH₵)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipt.allocations.map((a, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{a.feeCategoryName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{a.periodRef || 'Term 1'}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-right">
                      GH₵ {a.amountAllocated.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-emerald-50/50">
                  <td colSpan={2} className="py-2.5 px-3 font-bold text-slate-900 uppercase">
                    Total Amount Received
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-emerald-800 text-right text-sm">
                    GH₵ {receipt.totalReceived.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance Statement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs mb-6 flex justify-between items-center">
            <span className="text-amber-900 font-medium">Outstanding Balance After Payment:</span>
            <span className="font-mono font-bold text-amber-900 text-sm">
              GH₵ {receipt.outstandingBalanceAfterPayment.toFixed(2)}
            </span>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <p className="text-[11px] text-slate-500 italic mb-4">
              Note: {receipt.notes}
            </p>
          )}

          {/* Signatures & Footer */}
          <div className="grid grid-cols-2 gap-8 text-[11px] text-slate-600 pt-4 border-t border-slate-200">
            <div>
              <div className="mb-8">
                <span className="text-slate-400">Received By:</span>{' '}
                <span className="font-semibold text-slate-800">{receipt.collectorName}</span>
              </div>
              <div className="border-t border-slate-400 pt-1 w-3/4">Authorized Cashier Signature</div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="border-t border-slate-400 pt-1 w-3/4 ml-auto">Official School Stamp</div>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400">
            System generated by ClassLedger ERP • All transactions recorded in Greenwich Mean Time (GMT) • Thank you
          </div>
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end space-x-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition flex items-center cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
