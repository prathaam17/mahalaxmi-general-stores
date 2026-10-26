import React, { useRef } from 'react';
import { Printer, X, CheckCircle2, PlusCircle, ArrowLeft } from 'lucide-react';
import type { BillDetail } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillDetail | null;
  onNewBill: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  onNewBill,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt: number) => {
    return `₹${amt.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="print:hidden px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">ಮಾರಾಟ ದಾಖಲು (Sale Record & Slip)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="overflow-y-auto p-6 flex-1 bg-stone-50 flex justify-center">
          <div
            ref={receiptRef}
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white p-5 border border-stone-300 shadow-sm text-stone-900 font-mono text-xs leading-relaxed select-text"
          >
            {/* Header */}
            <div className="text-center space-y-0.5 pb-2">
              <h2 className="font-black text-base tracking-wide text-stone-950">
                MAHALAXMI GENERAL STORES
              </h2>
              <p className="text-[11px] font-sans text-stone-600">
                Provisions & Daily Essentials
              </p>
              <p className="text-[10px] text-stone-500">
                Main Road, Honnavar, Uttara Kannada
              </p>
              <p className="text-[10px] text-stone-500">Karnataka - 581334</p>
              <p className="text-[10px] text-stone-600 font-bold">Ph: +91 94800 12345</p>
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Bill Meta */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Bill No:</span>
                <span className="font-bold">{bill.billNumber}</span>
              </div>
              {bill.slipNumber && (
                <div className="flex justify-between text-amber-900 font-bold bg-amber-50 px-1 py-0.5 rounded">
                  <span>Paper Slip #:</span>
                  <span>{bill.slipNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{bill.createdAt}</span>
              </div>
              {bill.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold truncate max-w-[180px]">{bill.customerName}</span>
                </div>
              )}
              {bill.customerPhone && (
                <div className="flex justify-between text-[10px] text-stone-500">
                  <span>Phone:</span>
                  <span>{bill.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Items Table */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-[11px] border-b border-stone-200 pb-1">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-right">Qty</span>
                <span className="w-1/4 text-right">Amount</span>
              </div>
              {bill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] py-0.5">
                  <div className="w-1/2 pr-1">
                    <div className="truncate font-sans font-medium">{item.productName}</div>
                    <div className="text-[10px] text-stone-500">
                      @{item.unitPrice}/{item.unit}
                    </div>
                  </div>
                  <div className="w-1/4 text-right">
                    {item.quantity} {item.unit}
                  </div>
                  <div className="w-1/4 text-right font-semibold">
                    {formatCurrency(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span>{bill.totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(bill.subtotal)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatCurrency(bill.discount)}</span>
                </div>
              )}
              <div className="border-t border-stone-300 pt-1 flex justify-between text-sm font-bold">
                <span>GRAND TOTAL:</span>
                <span className="font-black text-stone-950">{formatCurrency(bill.grandTotal)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Payment Breakdown */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold">{bill.paymentMode}</span>
              </div>
              {bill.paymentMode === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>{formatCurrency(bill.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Change Returned:</span>
                    <span>{formatCurrency(bill.changeReturned)}</span>
                  </div>
                </>
              )}
              {bill.paymentMode === 'UPI' && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>UPI Payment Received:</span>
                  <span>{formatCurrency(bill.upiReceived)}</span>
                </div>
              )}
              {bill.paymentMode === 'CREDIT' && (
                <div className="p-1.5 bg-amber-50 border border-amber-200 rounded mt-1 space-y-0.5 text-[10px]">
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>Udhaar Added to Account:</span>
                    <span>{formatCurrency(bill.creditAdded)}</span>
                  </div>
                  <p className="text-stone-500">Record updated in customer credit ledger.</p>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Footer message */}
            <div className="text-center space-y-1 pt-1 text-[10px] text-stone-500">
              <p className="font-bold text-stone-800 font-sans">
                ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ
              </p>
              <p>Thank you! Visit Again</p>
              <p className="text-[9px] text-stone-400">Offline Counter POS • Honnavar</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="print:hidden px-4 py-3 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Close</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Thermal Receipt</span>
            </button>

            <button
              onClick={onNewBill}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Bill (F2)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
