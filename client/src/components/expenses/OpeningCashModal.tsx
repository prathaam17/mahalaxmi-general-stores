import React, { useState, useEffect } from 'react';
import { X, Check, Banknote, AlertCircle } from 'lucide-react';

interface OpeningCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOpeningCash: number;
  date: string;
  onSave: (date: string, amount: number, notes?: string) => Promise<void>;
}

export const OpeningCashModal: React.FC<OpeningCashModalProps> = ({
  isOpen,
  onClose,
  currentOpeningCash,
  date,
  onSave,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(String(currentOpeningCash || 1000));
      setNotes('Morning cash float for customer change');
      setError(null);
    }
  }, [isOpen, currentOpeningCash]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handlePreset = (val: number) => {
    setAmount(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 0) {
      setError('Opening cash cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(date, numAmount, notes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set opening cash');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Banknote className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Set Morning Opening Cash • ಆರಂಭಿಕ ನಗದು</h3>
              <p className="text-xs text-stone-400">Cash float kept in drawer for {date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
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

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Opening Float Amount (₹) • ಆರಂಭಿಕ ಚಿಲ್ಲರೆ ಹಣ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-stone-500 text-lg font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-lg font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Quick presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-stone-400 font-semibold uppercase">Presets:</span>
              {[500, 1000, 1500, 2000, 3000].map((preset) => (
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

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Remarks • ಟಿಪ್ಪಣಿ
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Buttons */}
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
              disabled={isSubmitting || numAmount < 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : `Set Opening Cash (₹${numAmount.toFixed(2)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
