import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  PackagePlus,
  AlertCircle,
  Banknote,
  QrCode,
  Building,
  CreditCard,
} from 'lucide-react';
import type {
  SupplierWithMeta,
  ProductWithCategory,
  PurchaseFormData,
  PurchaseItemFormData,
} from '../../types';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierWithMeta[];
  products: ProductWithCategory[];
  defaultSupplierId?: number;
  onSave: (data: PurchaseFormData) => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  defaultSupplierId,
  onSave,
}) => {
  const [supplierId, setSupplierId] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT'>('CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<PurchaseItemFormData[]>([
    {
      productId: null,
      productName: '',
      quantity: 1,
      unit: 'packet',
      unitCostPrice: 0,
      lineTotal: 0,
      updateProductCost: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      const initialSuppId = defaultSupplierId || (suppliers.length > 0 ? suppliers[0].id : 0);
      setSupplierId(initialSuppId);
      setInvoiceNumber('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('CASH');
      setNotes('');
      setError(null);

      // Start with 1 empty item
      setItems([
        {
          productId: null,
          productName: '',
          quantity: 1,
          unit: 'packet',
          unitCostPrice: 0,
          lineTotal: 0,
          updateProductCost: true,
        },
      ]);
    }
  }, [isOpen, defaultSupplierId, suppliers]);

  // Calculate invoice subtotal
  const grandTotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  // Keep paidAmount synced when paymentMode changes if not manually set
  useEffect(() => {
    if (paymentMode === 'CREDIT') {
      setPaidAmount('0');
    } else {
      setPaidAmount(String(grandTotal));
    }
  }, [paymentMode, grandTotal]);

  if (!isOpen) return null;

  const numPaid = parseFloat(paidAmount) || 0;
  const unpaidCredit = Math.max(0, grandTotal - numPaid);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: null,
        productName: '',
        quantity: 1,
        unit: 'packet',
        unitCostPrice: 0,
        lineTotal: 0,
        updateProductCost: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemProductSelect = (index: number, prodIdStr: string) => {
    const prodId = parseInt(prodIdStr, 10);
    const prod = products.find((p) => p.id === prodId);

    setItems((prev) => {
      const updated = [...prev];
      if (prod) {
        const qty = updated[index].quantity || 1;
        const cost = prod.costPrice || 0;
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          productName: prod.name,
          unit: prod.unit,
          unitCostPrice: cost,
          lineTotal: Math.round(qty * cost * 100) / 100,
        };
      } else {
        updated[index] = {
          ...updated[index],
          productId: null,
        };
      }
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemFormData, value: unknown) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unitCostPrice') {
        const qty = Number(field === 'quantity' ? value : item.quantity) || 0;
        const cost = Number(field === 'unitCostPrice' ? value : item.unitCostPrice) || 0;
        item.lineTotal = Math.round(qty * cost * 100) / 100;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      setError('Please select a supplier / distributor.');
      return;
    }

    const validItems = items.filter((i) => i.productName.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item with name and quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: PurchaseFormData = {
        supplierId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        items: validItems,
        paymentMode,
        paidAmount: Math.min(grandTotal, numPaid),
        notes: notes.trim() || undefined,
      };

      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record purchase entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-900 flex items-center justify-between border-b border-amber-600/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-stone-900">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Record Stock Inward / Purchase • ಹೊಸ ಸರಕು ಸ್ವೀಕಾರ & ಖರೀದಿ
              </h3>
              <p className="text-xs text-stone-700">Receive goods into shop inventory & update ledger</p>
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

          {/* Supplier & Invoice metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Supplier • ಸರಬರಾಜುದಾರ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={0} disabled>Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.currentBalance > 0 ? `(Owes: ₹${s.currentBalance.toFixed(0)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Distributor Invoice # • ಬಿಲ್ ಸಂಖ್ಯೆ
              </label>
              <input
                type="text"
                placeholder="e.g. INV-8891 (Leave blank to auto-generate)"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Purchase Date • ದಿನಾಂಕ
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Purchase Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Inward Items • ಸರಕು ವಿವರಗಳು ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                >
                  {/* Select or type product */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Product Name • ಸರಕು
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={item.productId || ''}
                        onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Choose from Catalog or Type below --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.kannadaName ? `(${p.kannadaName})` : ''} [Stock: {p.currentStock} {p.unit}]
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        placeholder="Or custom item name..."
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Quantity & Unit */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Qty • ಪ್ರಮಾಣ
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="packet">packet</option>
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="piece">piece</option>
                      <option value="litre">litre</option>
                      <option value="box">box</option>
                      <option value="bag">bag</option>
                    </select>
                  </div>

                  {/* Unit Cost & Line Total */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Cost (₹) • ದರ
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={item.unitCostPrice || ''}
                      onChange={(e) => handleItemChange(idx, 'unitCostPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  {/* Delete Item */}
                  <div className="sm:col-span-1 flex items-center justify-end pb-1.5">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Bottom item flags */}
                  <div className="sm:col-span-12 flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                    <label className="flex items-center gap-1.5 text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.updateProductCost}
                        onChange={(e) => handleItemChange(idx, 'updateProductCost', e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Update catalog purchase cost price to ₹{item.unitCostPrice.toFixed(2)}</span>
                    </label>
                    <span className="font-mono font-bold text-stone-800">
                      Line Total: ₹{(item.lineTotal || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Settlement Summary Card */}
          <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-amber-200/70">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Purchase Invoice Total • ಒಟ್ಟು ಮೊತ್ತ
              </span>
              <span className="text-xl font-black text-amber-950 font-mono">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Payment Mode • ಪಾವತಿ ವಿಧಾನ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                      paymentMode === 'CASH'
                        ? 'border-amber-600 bg-white text-stone-900 ring-2 ring-amber-500/30'
                        : 'border-stone-200 bg-white/60 text-stone-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('BANK_TRANSFER')}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                      paymentMode === 'BANK_TRANSFER'
                        ? 'border-amber-600 bg-white text-stone-900 ring-2 ring-amber-500/30'
                        : 'border-stone-200 bg-white/60 text-stone-600'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bank / NEFT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                      paymentMode === 'UPI'
                        ? 'border-amber-600 bg-white text-stone-900 ring-2 ring-amber-500/30'
                        : 'border-stone-200 bg-white/60 text-stone-600'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-purple-600" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('CREDIT')}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                      paymentMode === 'CREDIT'
                        ? 'border-amber-600 bg-white text-stone-900 ring-2 ring-amber-500/30'
                        : 'border-stone-200 bg-white/60 text-stone-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                    <span>Credit (Udhaar)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Amount Paid Now (₹) • ತಕ್ಷಣ ಪಾವತಿಸಿದ ಮೊತ್ತ
                </label>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-2 text-stone-500 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-stone-700 bg-white/80 p-2 rounded-lg border border-stone-200">
                  <span>Balance Added to Payable:</span>
                  <span className="font-mono font-bold text-amber-900">
                    ₹{unpaidCredit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Purchase notes / distributor remarks (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              disabled={isSubmitting || grandTotal <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Inward...' : `Confirm Purchase (₹${grandTotal.toFixed(2)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
