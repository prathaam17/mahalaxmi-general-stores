import React, { useState, useEffect } from 'react';
import { X, Check, Truck, AlertCircle } from 'lucide-react';
import type { SupplierWithMeta, SupplierFormData } from '../../types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: SupplierWithMeta | null;
  onSave: (data: SupplierFormData) => Promise<void>;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setPhone(supplierToEdit.phone || '');
      setGstin(supplierToEdit.gstin || '');
      setAddress(supplierToEdit.address || '');
      setInitialBalance('0');
    } else {
      setName('');
      setPhone('');
      setGstin('');
      setAddress('');
      setInitialBalance('0');
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the supplier / distributor name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: SupplierFormData = {
        name: name.trim(),
        phone: phone.trim() || null,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
        address: address.trim() || null,
        initialBalance: supplierToEdit ? undefined : parseFloat(initialBalance) || 0,
      };

      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-900 flex items-center justify-between border-b border-amber-600/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-stone-900">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {supplierToEdit ? 'Edit Supplier • ಸರಬರಾಜುದಾರರ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Add New Supplier • ಹೊಸ ಸರಬರಾಜುದಾರ'}
              </h3>
              <p className="text-xs text-stone-700">Distributor details & accounts payable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600/20 text-stone-700 hover:text-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Supplier / Agency Name • ಹೆಸರು <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Kamat Wholesale Distributors, Kumta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phone Number • ದೂರವಾಣಿ
              </label>
              <input
                type="text"
                placeholder="e.g. +91 94481 22334"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                GSTIN / Tax ID • ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ
              </label>
              <input
                type="text"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Address / Town • ವಿಳಾಸ / ಪಟ್ಟಣ
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Main Bazaar Road, Kumta / Honnavar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
            />
          </div>

          {!supplierToEdit && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Opening Balance Payable (₹) • ಹಳೆ ಬಾಕಿ ಮೊತ್ತ
              </label>
              <p className="text-[11px] text-stone-500 mb-2">
                If the store already owes money to this supplier from prior invoices, enter it here.
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-500 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 bg-white border border-stone-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
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
              <span>{isSubmitting ? 'Saving...' : supplierToEdit ? 'Save Changes' : 'Register Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
