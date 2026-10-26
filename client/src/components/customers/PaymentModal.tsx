import React, { useState } from 'react';
import { X, Check, Banknote, QrCode, AlertCircle, ArrowDownCircle } from 'lucide-react';
import type { CustomerWithMeta } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerWithMeta | null;
  onRecordPayment: (id: number, amount: number, paymentMode: 'CASH' | 'UPI', notes?: string) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const currentBal = customer.currentBalance;
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
      setError('Please enter a valid repayment amount greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onRecordPayment(customer.id, numAmount, paymentMode, notes.trim() || undefined);
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record repayment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowDownCircle className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-sm">Record Udhaar Repayment • ಜಮಾ ಪಾವತಿ</h3>
              <p className="text-xs text-emerald-100 truncate max-w-[220px]">
                {customer.name} ({customer.phone || 'No phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance Card */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-600 block">Total Due Balance</span>
              <span className="text-[10px] text-stone-500">ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತ</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-rose-700">
                ₹{currentBal.toFixed(2)}
              </span>
              {currentBal > 0 && (
                <button
                  type="button"
                  onClick={handleFullBalance}
                  className="block text-[11px] text-amber-800 hover:underline font-bold mt-0.5"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Payment Mode (ಪಾವತಿ ವಿಧಾನ)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                  paymentMode === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash Received</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                  paymentMode === 'UPI'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>UPI / QR Code</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">
              Amount to Receive (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-bold font-mono p-3 pl-8 border border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-stone-900"
                autoFocus
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">
                ₹
              </span>
            </div>

            {/* Quick Currency Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePreset(val)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded border border-stone-200 text-xs font-mono font-medium transition-colors"
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Remaining Balance Preview */}
          {numAmount > 0 && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-600">Remaining Balance After Payment:</span>
              <span className={`font-mono font-bold text-sm ${remainingBal <= 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                ₹{remainingBal.toFixed(2)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">Payment Reference / Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid cash at shop counter, GPay ref 1234..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Credit Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
