import React, { useState, useEffect } from 'react';
import { X, User, Check, AlertCircle } from 'lucide-react';
import type { CustomerWithMeta, CustomerFormData } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit: CustomerWithMeta | null;
  onSubmit: (data: CustomerFormData, id?: number) => Promise<void>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<string>('2000');
  const [initialBalance, setInitialBalance] = useState<string>('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone || '');
      setAddress(customerToEdit.address || '');
      setCreditLimit(String(customerToEdit.creditLimit));
      setInitialBalance('0'); // not editable during update
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setCreditLimit('2000');
      setInitialBalance('0');
    }
    setError(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData: CustomerFormData = {
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        creditLimit: parseFloat(creditLimit) || 2000,
        initialBalance: !customerToEdit ? parseFloat(initialBalance) || 0 : undefined,
      };

      await onSubmit(formData, customerToEdit?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-stone-950" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                {customerToEdit ? 'Edit Customer Account' : 'Register New Customer • ಹೊಸ ಗ್ರಾಹಕ'}
              </h3>
              <p className="text-xs text-stone-900/80">
                {customerToEdit ? 'ಗ್ರಾಹಕರ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ' : 'ಉದ್ಧಾರ ಖಾತೆ ತೆರೆಯಿರಿ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600/50 text-stone-950 transition-colors"
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">
              Customer Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ganesh Naik, Suresh Bhat"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">Phone Number (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 94812 34567"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">Address / Locality (ವಿಳಾಸ / ಏರಿಯಾ)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Prabhat Nagar, Car Street, Honnavar"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">
                Credit Limit (₹) <span className="text-stone-400 font-normal">ಉದ್ಧಾರ ಮಿತಿ</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full p-2.5 font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              />
            </div>

            {!customerToEdit && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Opening Balance (₹) <span className="text-stone-400 font-normal">ಆರಂಭಿಕ ಸಾಲ</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
                />
              </div>
            )}
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4 text-stone-950" />
              <span>{customerToEdit ? 'Save Changes' : 'Open Khata Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
