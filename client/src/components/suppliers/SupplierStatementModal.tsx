import React from 'react';
import { X, Printer, Truck, Calendar, Phone, MapPin, Receipt, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { SupplierStatement } from '../../types';

interface SupplierStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: SupplierStatement | null;
  loading: boolean;
}

export const SupplierStatementModal: React.FC<SupplierStatementModalProps> = ({
  isOpen,
  onClose,
  statement,
  loading,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Screen Only) */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Supplier Statement • ಸರಬರಾಜುದಾರರ ಖಾತೆ ವಿವರ</h3>
              <p className="text-xs text-stone-300">
                {statement?.supplier.name || 'Loading statement...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !statement}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div className="p-6 overflow-y-auto print:p-0 print:m-0">
          {loading || !statement ? (
            <div className="py-20 text-center text-stone-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-3" />
              <p className="text-sm font-medium">Loading ledger statement entries...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Printable Header */}
              <div className="border-b-2 border-stone-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <h1 className="text-xl font-black text-stone-900 tracking-tight">
                    MAHALAXMI GENERAL STORES
                  </h1>
                  <p className="text-xs font-semibold text-stone-600">
                    ಮಹಾಲಕ್ಷ್ಮಿ ಜನರಲ್ ಸ್ಟೋರ್ಸ್ • Honnavar, Uttara Kannada, Karnataka - 581334
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Phone: +91 94801 23456 • GSTIN: 29AAAAA0000A1Z5
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-bold text-xs">
                    SUPPLIER LEDGER STATEMENT
                  </span>
                  <div className="text-[11px] text-stone-500 mt-1 flex items-center sm:justify-end gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Statement Date: {new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Supplier Info & Statement Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Supplier / Distributor Details
                  </span>
                  <div className="text-base font-bold text-stone-900 mt-1">
                    {statement.supplier.name}
                  </div>
                  {statement.supplier.phone && (
                    <div className="text-stone-600 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{statement.supplier.phone}</span>
                    </div>
                  )}
                  {statement.supplier.gstin && (
                    <div className="text-stone-600 font-mono mt-0.5">
                      <span className="font-semibold text-stone-500">GSTIN:</span> {statement.supplier.gstin}
                    </div>
                  )}
                  {statement.supplier.address && (
                    <div className="text-stone-600 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{statement.supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-stone-500">Purchases</span>
                    <span className="text-sm font-bold text-stone-900 font-mono">
                      ₹{statement.summary.totalDeliveries.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-950 font-mono">
                      ₹{statement.summary.totalPayments.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-800">Payable Balance</span>
                    <span className="text-base font-black text-amber-950 font-mono">
                      ₹{statement.summary.currentBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>Chronological Transaction Ledger • ವಹಿವಾಟು ಪಟ್ಟಿ ({statement.entries.length} Entries)</span>
                </h4>

                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Particulars / Notes</th>
                        <th className="py-2.5 px-3 text-center">Type</th>
                        <th className="py-2.5 px-3 text-right">Inward / Goods (₹)</th>
                        <th className="py-2.5 px-3 text-right">Payment (₹)</th>
                        <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {statement.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-stone-400">
                            No transactions recorded for this supplier yet.
                          </td>
                        </tr>
                      ) : (
                        statement.entries.map((entry) => {
                          const isCredit = entry.entryType === 'CREDIT';
                          return (
                            <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-stone-600 whitespace-nowrap">
                                {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-2.5 px-3 font-medium">
                                <div>{entry.notes || (isCredit ? 'Purchase Inward' : 'Payment')}</div>
                                {entry.paymentMode && (
                                  <span className="text-[10px] text-stone-400 uppercase">
                                    Mode: {entry.paymentMode}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {isCredit ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    <ArrowDownRight className="w-3 h-3" /> INWARD (CR)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <ArrowUpRight className="w-3 h-3" /> PAID (DR)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium">
                                {isCredit ? `₹${entry.amount.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700">
                                {!isCredit ? `₹${entry.amount.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                                ₹{entry.balanceAfter.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printable footer */}
              <div className="pt-6 border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-500">
                <p>Mahalaxmi General Stores • Computer Generated Statement</p>
                <p className="font-semibold text-stone-700">Authorized Signatory / ಮುದ್ರೆ</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
