import React, { useState } from 'react';
import { X, Check, Banknote, QrCode, Building, AlertCircle, ArrowUpRight } from 'lucide-react';
import type { SupplierWithMeta } from '../../types';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithMeta | null;
  onRecordPayment: (
    id: number,
    amount: number,
    paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER',
    notes?: string
  ) => Promise<void>;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !supplier) return null;

  const currentBal = supplier.currentBalance;
  const numAmount = parseFloat(amount) || 0;
  const remainingBal = Math.round((currentBal - numAmount) * 100) / 100;

  const handleFullBalance = () => {
    setAmount(String(currentBal));
  };

  const handlePreset = (val: number) => {
    setAmount(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onRecordPayment(supplier.id, numAmount, paymentMode, notes.trim() || undefined);
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record supplier payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowUpRight className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-bold text-sm">Pay Supplier • ಸರಬರಾಜುದಾರರಿಗೆ ಪಾವತಿ</h3>
              <p className="text-xs text-amber-100 truncate max-w-[220px]">
                {supplier.name} ({supplier.phone || 'No phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-700 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance Overview Card */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                Current Payable • ನೀಡಬೇಕಾದ ಬಾಕಿ
              </span>
              <div className="text-xl font-black text-amber-950 font-mono mt-0.5">
                ₹{currentBal.toFixed(2)}
              </div>
            </div>
            {currentBal > 0 && (
              <button
                type="button"
                onClick={handleFullBalance}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Pay Full Balance
              </button>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Payment Amount (₹) • ಪಾವತಿ ಮೊತ್ತ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-stone-500 text-lg font-bold">₹</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-lg font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-stone-400 font-semibold uppercase">Presets:</span>
              {[500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-600 transition-colors"
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Remaining balance preview */}
          {numAmount > 0 && (
            <div className="px-3.5 py-2 rounded-lg bg-stone-100 text-xs flex justify-between items-center text-stone-700">
              <span>Balance After Payment:</span>
              <span
                className={`font-mono font-bold ${
                  remainingBal <= 0 ? 'text-emerald-600' : 'text-amber-800'
                }`}
              >
                ₹{remainingBal.toFixed(2)}
              </span>
            </div>
          )}

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Payment Mode • ಪಾವತಿ ವಿಧಾನ
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('BANK_TRANSFER')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'BANK_TRANSFER'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <Building className="w-4 h-4 mb-1 text-blue-600" />
                <span>Bank / NEFT</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'UPI'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <QrCode className="w-4 h-4 mb-1 text-purple-600" />
                <span>UPI / GPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'CASH'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <Banknote className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Cash • ನಗದು</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Payment Reference / Notes • ಟಿಪ್ಪಣಿ / ರೆಫರೆನ್ಸ್
            </label>
            <input
              type="text"
              placeholder="e.g. UTR #12345678, Cheque #0045, or Paid at shop"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : `Record Payment of ₹${numAmount.toFixed(2)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
