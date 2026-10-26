import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, AlertCircle, Banknote, QrCode, Building } from 'lucide-react';
import type { ExpenseItem, ExpenseFormData } from '../../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: ExpenseItem | null;
  onSave: (data: ExpenseFormData & { id?: number; expenseDate: string }) => Promise<void>;
}

export const EXPENSE_CATEGORIES = [
  { id: 'Tea & Refreshments', label: 'Tea & Refreshments', kannada: 'ಚಹಾ / ತಿಂಡಿ' },
  { id: 'Packaging & Bags', label: 'Packaging & Bags', kannada: 'ಕ್ಯಾರಿ ಬ್ಯಾಗ್ / ಕಾಗದ' },
  { id: 'Helper Wages & Hamali', label: 'Helper Wages & Hamali', kannada: 'ಕೂಲಿ / ಹಮಾಲಿ' },
  { id: 'Electricity & Utilities', label: 'Electricity & Utilities', kannada: 'ವಿದ್ಯುತ್ & ಬಿಲ್' },
  { id: 'Shop Maintenance', label: 'Shop Maintenance', kannada: 'ಅಂಗಡಿ ನಿರ್ವಹಣೆ' },
  { id: 'Transportation', label: 'Transportation & Auto', kannada: 'ಸಾರಿಗೆ ವೆಚ್ಚ' },
  { id: 'Miscellaneous', label: 'Miscellaneous', kannada: 'ಇತರೆ ವೆಚ್ಚಗಳು' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  onSave,
}) => {
  const [category, setCategory] = useState<string>('Tea & Refreshments');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(String(expenseToEdit.amount));
      setPaymentMode(expenseToEdit.paymentMode as 'CASH' | 'UPI' | 'BANK_TRANSFER');
      setExpenseDate(expenseToEdit.expenseDate);
    } else {
      setCategory('Tea & Refreshments');
      setDescription('');
      setAmount('');
      setPaymentMode('CASH');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handlePreset = (val: number) => {
    setAmount(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please provide a short description for the expense.');
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSave({
        id: expenseToEdit?.id,
        category,
        description: description.trim(),
        amount: numAmount,
        paymentMode,
        expenseDate,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-900 flex items-center justify-between border-b border-amber-600/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-stone-900">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {expenseToEdit ? 'Edit Expense • ವೆಚ್ಚ ತಿದ್ದುಪಡಿ' : 'Record Shop Expense • ದೈನಂದಿನ ಖರ್ಚು'}
              </h3>
              <p className="text-xs text-stone-700">Track petty cash and daily operational spending</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600/20 text-stone-700 hover:text-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Category Chips */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Category • ವಿಭಾಗ <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    category === cat.id
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cat.label} ({cat.kannada})
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description • ವಿವರಣೆ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Morning tea for shopkeeper & helper, carry bags bundle"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Amount input & presets */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Amount (₹) • ಮೊತ್ತ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-stone-500 text-lg font-bold">₹</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-lg font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-stone-400 font-semibold uppercase">Presets:</span>
              {[20, 50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePreset(val)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-600 transition-colors"
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Payment Mode • ಪಾವತಿ ವಿಧಾನ
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    paymentMode === 'CASH'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Banknote className="w-4 h-4 mb-0.5 text-emerald-600" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    paymentMode === 'UPI'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <QrCode className="w-4 h-4 mb-0.5 text-purple-600" />
                  <span>UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('BANK_TRANSFER')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    paymentMode === 'BANK_TRANSFER'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Building className="w-4 h-4 mb-0.5 text-blue-600" />
                  <span>Bank</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Date • ದಿನಾಂಕ
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
              />
            </div>
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
              disabled={isSubmitting || numAmount <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : expenseToEdit
                  ? 'Update Expense'
                  : `Save Expense (₹${numAmount.toFixed(2)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
