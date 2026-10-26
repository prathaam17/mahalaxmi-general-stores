import React, { useRef } from 'react';
import { X, Printer, ArrowLeft, BookOpen } from 'lucide-react';
import type { CustomerStatement } from '../../types';

interface CustomerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: CustomerStatement | null;
  loading: boolean;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  isOpen,
  onClose,
  statement,
  loading,
}) => {
  const statementRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt: number) => {
    return `₹${amt.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden when printing) */}
        <div className="print:hidden px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Customer Khata Statement • ಖಾತೆ ವಿವರ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Statement Container */}
        <div className="overflow-y-auto p-6 flex-1 bg-stone-50">
          {loading || !statement ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-stone-500 font-medium">Loading customer ledger entries...</p>
            </div>
          ) : (
            <div
              ref={statementRef}
              id="customer-statement"
              className="bg-white p-6 border border-stone-300 rounded-xl shadow-xs space-y-5 text-stone-900 select-text"
            >
              {/* Header */}
              <div className="border-b border-stone-300 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black text-stone-950 tracking-tight">
                    MAHALAXMI GENERAL STORES
                  </h2>
                  <p className="text-xs text-stone-600">Provisions & Daily Essentials</p>
                  <p className="text-xs text-stone-500">
                    Main Road, Honnavar, Uttara Kannada, Karnataka - 581334
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    Udhaar Khata Statement
                  </span>
                  <p className="text-[11px] text-stone-500 font-mono mt-1">
                    Generated: {new Date().toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Customer</span>
                  <span className="font-bold text-stone-900 text-sm">{statement.customer.name}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Phone</span>
                  <span className="font-mono text-stone-700">{statement.customer.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Address</span>
                  <span className="text-stone-700 truncate block">{statement.customer.address || 'Honnavar'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Credit Limit</span>
                  <span className="font-mono font-bold text-stone-800">
                    {formatCurrency(statement.customer.creditLimit)}
                  </span>
                </div>
              </div>

              {/* Financial Summary Strip */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Total Purchases (Debits)
                  </span>
                  <span className="text-base font-black font-mono text-stone-900">
                    {formatCurrency(statement.summary.totalDebits)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Total Paid (Credits)
                  </span>
                  <span className="text-base font-black font-mono text-emerald-800">
                    {formatCurrency(statement.summary.totalCredits)}
                  </span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Current Balance Due
                  </span>
                  <span className="text-lg font-black font-mono text-rose-700">
                    {formatCurrency(statement.summary.currentBalance)}
                  </span>
                </div>
              </div>

              {/* Ledger Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 border-y border-stone-200 text-stone-600 font-bold">
                    <tr>
                      <th className="px-3 py-2.5">Date & Time</th>
                      <th className="px-3 py-2.5">Particulars / Ref</th>
                      <th className="px-3 py-2.5 text-center">Type</th>
                      <th className="px-3 py-2.5 text-right">Debit (+)</th>
                      <th className="px-3 py-2.5 text-right">Credit (-)</th>
                      <th className="px-3 py-2.5 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {statement.entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-stone-400 font-sans">
                          No transactions recorded in this account yet.
                        </td>
                      </tr>
                    ) : (
                      statement.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-amber-50/30">
                          <td className="px-3 py-2.5 text-stone-600 text-[11px] whitespace-nowrap">
                            {entry.createdAt}
                          </td>
                          <td className="px-3 py-2.5 font-sans">
                            <div className="font-semibold text-stone-900">
                              {entry.billNumber ? `Bill #${entry.billNumber}` : entry.notes || 'Transaction'}
                            </div>
                            {entry.paymentMode && (
                              <div className="text-[10px] text-stone-400 font-mono">
                                Mode: {entry.paymentMode}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {entry.entryType === 'DEBIT' ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Purchase
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Repayment
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-rose-700 font-semibold">
                            {entry.entryType === 'DEBIT' ? formatCurrency(entry.amount) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold">
                            {entry.entryType === 'CREDIT' ? formatCurrency(entry.amount) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-stone-900">
                            {formatCurrency(entry.balanceAfter)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-stone-200 text-center text-[10px] text-stone-400">
                <p className="font-bold text-stone-600 font-sans">
                  Mahalaxmi General Stores, Honnavar • ಧನ್ಯವಾದಗಳು
                </p>
                <p>Offline Khata Record • Please retain for your reference</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="print:hidden px-6 py-3.5 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!statement || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Khata Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
