import React, { useState } from 'react';
import { X, Check, Scale, AlertCircle } from 'lucide-react';
import type { ProductWithCategory } from '../../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithCategory | null;
  onAdjust: (id: number, delta: number, reason: string) => Promise<void>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
  onAdjust,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [qtyValue, setQtyValue] = useState<string>('5');
  const [reason, setReason] = useState<string>('Physical stock reconciliation');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.currentStock;
  const numQty = parseFloat(qtyValue) || 0;
  const delta = adjustmentType === 'ADD' ? numQty : -numQty;
  const newStock = Math.max(0, Math.round((currentStock + delta) * 1000) / 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Adjustment quantity must be greater than zero.');
      return;
    }

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Please provide a reason for the stock adjustment.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAdjust(product.id, delta, finalReason);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
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
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Adjust Stock Level</h3>
              <p className="text-xs text-stone-400 truncate max-w-[220px]">
                {product.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock vs New Stock Preview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-center">
            <div>
              <span className="text-[11px] text-stone-500 font-medium block">Current Stock</span>
              <span className="text-lg font-bold font-mono text-stone-800">
                {currentStock} {product.unit}
              </span>
            </div>
            <div className="border-l border-stone-200 pl-3">
              <span className="text-[11px] text-stone-500 font-medium block">Updated Stock</span>
              <span className={`text-lg font-bold font-mono ${newStock <= product.minStockAlert ? 'text-amber-700' : 'text-emerald-700'}`}>
                {newStock} {product.unit}
              </span>
            </div>
          </div>

          {/* Action Tabs: Add vs Deduct */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Action Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('ADD')}
                className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                  adjustmentType === 'ADD'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                + Add Stock (ಹೆಚ್ಚಿಸಿ)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('SUBTRACT')}
                className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                  adjustmentType === 'SUBTRACT'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                - Reduce Stock (ಕಡಿಮೆ ಮಾಡಿ)
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">
              Adjustment Quantity ({product.unit})
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={qtyValue}
              onChange={(e) => setQtyValue(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-bold font-mono text-stone-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            />
          </div>

          {/* Reason Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            >
              <option value="Physical stock reconciliation">Physical stock count reconciliation (ಖಾತೆ ಪರಿಶೀಲನೆ)</option>
              <option value="Direct stock delivery received">Direct stock delivery received (ಸರಬರಾಜು ಸ್ವೀಕಾರ)</option>
              <option value="Damaged or expired goods">Damaged or expired goods (ಹಾಳಾದ ಸರಕು)</option>
              <option value="Customer return / exchange">Customer return / exchange (ಗ್ರಾಹಕರ ವಾಪಸಾತಿ)</option>
              <option value="Packaging leakage or spillage">Packaging leakage or spillage (ಸೋರಿಕೆ / ನಷ್ಟ)</option>
              <option value="Other">Other reason (ಇತರೆ ಕಾರಣ)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div className="space-y-1">
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific adjustment note..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              />
            </div>
          )}

          {/* Footer actions */}
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
              disabled={isSubmitting || numQty <= 0}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4 text-stone-950" />
              <span>Confirm Stock Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
