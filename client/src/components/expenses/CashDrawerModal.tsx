import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calculator,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Coins,
} from 'lucide-react';
import type { CashRegisterSummary, CashRegisterDenominations } from '../../types';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: CashRegisterSummary | null;
  onCloseRegister: (
    date: string,
    denominations: CashRegisterDenominations,
    closingNotes?: string
  ) => Promise<void>;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
  summary,
  onCloseRegister,
}) => {
  const [denominations, setDenominations] = useState<CashRegisterDenominations>({
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
    coins: 0,
  });

  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (summary && isOpen) {
      setDenominations({
        note500: summary.denominations.note500 || 0,
        note200: summary.denominations.note200 || 0,
        note100: summary.denominations.note100 || 0,
        note50: summary.denominations.note50 || 0,
        note20: summary.denominations.note20 || 0,
        note10: summary.denominations.note10 || 0,
        coins: summary.denominations.coins || 0,
      });
      setClosingNotes(summary.closingNotes || '');
      setError(null);
    }
  }, [summary, isOpen]);

  if (!isOpen || !summary) return null;

  const handleDenomChange = (field: keyof CashRegisterDenominations, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setDenominations((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  // Calculate physical total
  const totalPhysicalCount =
    denominations.note500 * 500 +
    denominations.note200 * 200 +
    denominations.note100 * 100 +
    denominations.note50 * 50 +
    denominations.note20 * 20 +
    denominations.note10 * 10 +
    denominations.coins;

  const roundedPhysical = Math.round(totalPhysicalCount * 100) / 100;
  const difference = Math.round((roundedPhysical - summary.expectedCash) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onCloseRegister(summary.registerDate, denominations, closingNotes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile and close register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Day Close & Cash Reconciliation • ದಿನದ ಲೆಕ್ಕ ಮುಕ್ತಾಯ
              </h3>
              <p className="text-xs text-stone-400">
                Register Date: {summary.registerDate} • Mahalaxmi General Stores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* System Calculated Expected Cash Overview */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                System Expected Drawer Cash • ಲೆಕ್ಕದ ಪ್ರಕಾರ ಇರಬೇಕಾದ ನಗದು
              </span>
              <span className="text-xl font-black text-amber-950 font-mono">
                ₹{summary.expectedCash.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Opening Float</span>
                <p className="font-mono font-bold text-stone-800 mt-0.5">₹{summary.openingCash.toFixed(2)}</p>
              </div>

              <div className="p-2 bg-white rounded-lg border border-stone-200">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Cash Sales
                </span>
                <p className="font-mono font-bold text-emerald-700 mt-0.5">+₹{summary.cashSales.toFixed(2)}</p>
              </div>

              <div className="p-2 bg-white rounded-lg border border-stone-200">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Udhaar Recvd
                </span>
                <p className="font-mono font-bold text-emerald-700 mt-0.5">+₹{summary.cashUdhaarCollections.toFixed(2)}</p>
              </div>

              <div className="p-2 bg-white rounded-lg border border-stone-200">
                <span className="text-[10px] text-rose-700 uppercase font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Cash Spent
                </span>
                <p className="font-mono font-bold text-rose-700 mt-0.5">
                  -₹{(summary.cashExpenses + summary.cashSupplierPayments).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Currency Note Counter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Physical Currency Count • ಅಂಗಡಿ ಡ್ರಾಯರ್‌ನಲ್ಲಿರುವ ನೋಟು & ನಾಣ್ಯಗಳು</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* ₹500 */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800">₹500 Note</span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{(denominations.note500 * 500).toFixed(0)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.note500 || ''}
                  onChange={(e) => handleDenomChange('note500', e.target.value)}
                  placeholder="Count"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* ₹200 */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800">₹200 Note</span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{(denominations.note200 * 200).toFixed(0)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.note200 || ''}
                  onChange={(e) => handleDenomChange('note200', e.target.value)}
                  placeholder="Count"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* ₹100 */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800">₹100 Note</span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{(denominations.note100 * 100).toFixed(0)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.note100 || ''}
                  onChange={(e) => handleDenomChange('note100', e.target.value)}
                  placeholder="Count"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* ₹50 */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800">₹50 Note</span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{(denominations.note50 * 50).toFixed(0)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.note50 || ''}
                  onChange={(e) => handleDenomChange('note50', e.target.value)}
                  placeholder="Count"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* ₹20 */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800">₹20 Note</span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{(denominations.note20 * 20).toFixed(0)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.note20 || ''}
                  onChange={(e) => handleDenomChange('note20', e.target.value)}
                  placeholder="Count"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* ₹10 */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800">₹10 Note</span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{(denominations.note10 * 10).toFixed(0)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.note10 || ''}
                  onChange={(e) => handleDenomChange('note10', e.target.value)}
                  placeholder="Count"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Coins */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 sm:col-span-2">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Coins Total (₹)</span>
                  </span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ₹{denominations.coins.toFixed(2)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={denominations.coins || ''}
                  onChange={(e) => handleDenomChange('coins', e.target.value)}
                  placeholder="Total value of coins"
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Reconciliation Status Card */}
          <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-300 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Actual Physical Cash Counted
                </span>
                <div className="text-xl font-black text-stone-900 font-mono mt-0.5">
                  ₹{roundedPhysical.toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Difference • ವ್ಯತ್ಯಾಸ
                </span>
                <div
                  className={`text-xl font-black font-mono mt-0.5 ${
                    difference === 0
                      ? 'text-emerald-700'
                      : difference > 0
                      ? 'text-blue-700'
                      : 'text-rose-700'
                  }`}
                >
                  {difference > 0 ? `+₹${difference.toFixed(2)}` : `₹${difference.toFixed(2)}`}
                </div>
              </div>
            </div>

            {/* Status explanation pill */}
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                difference === 0
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : difference > 0
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {difference === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Exact Match: Physical drawer cash exactly matches system records! (ಲೆಕ್ಕ ಸರಿಯಾಗಿದೆ)</span>
                </>
              ) : difference > 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Cash Overage: Physical cash is ₹{difference.toFixed(2)} more than expected.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Cash Shortage: Physical cash is ₹{Math.abs(difference).toFixed(2)} less than expected.</span>
                </>
              )}
            </div>
          </div>

          {/* Closing Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Closing Remarks / Shop Notes • ಮುಕ್ತಾಯದ ಟಿಪ್ಪಣಿ
            </label>
            <input
              type="text"
              placeholder="e.g. Shop closed at 9:30 PM by Suresh, ₹1000 kept in drawer for tomorrow"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Closing Day...' : 'Reconcile & Close Cash Drawer for Today'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
