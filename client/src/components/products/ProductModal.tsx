import React, { useState, useEffect } from 'react';
import { X, Package, Check, AlertCircle, Percent } from 'lucide-react';
import type { CategoryItem, ProductWithCategory, ProductFormData } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: ProductWithCategory | null;
  categories: CategoryItem[];
  onSubmit: (data: ProductFormData, id?: number) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [kannadaName, setKannadaName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [isLoose, setIsLoose] = useState(false);
  const [unit, setUnit] = useState('packet');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [mrp, setMrp] = useState<string>('0');
  const [currentStock, setCurrentStock] = useState<string>('10');
  const [minStockAlert, setMinStockAlert] = useState<string>('5');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setKannadaName(productToEdit.kannadaName || '');
      setBarcode(productToEdit.barcode || '');
      setCategoryId(productToEdit.categoryId || '');
      setIsLoose(productToEdit.isLoose);
      setUnit(productToEdit.unit);
      setCostPrice(String(productToEdit.costPrice));
      setSellingPrice(String(productToEdit.sellingPrice));
      setMrp(String(productToEdit.mrp || productToEdit.sellingPrice));
      setCurrentStock(String(productToEdit.currentStock));
      setMinStockAlert(String(productToEdit.minStockAlert));
    } else {
      setName('');
      setKannadaName('');
      setBarcode('');
      setCategoryId(categories[0]?.id || '');
      setIsLoose(false);
      setUnit('packet');
      setCostPrice('0');
      setSellingPrice('0');
      setMrp('0');
      setCurrentStock('10');
      setMinStockAlert('5');
    }
    setError(null);
  }, [productToEdit, categories, isOpen]);

  // Adjust default unit when toggling loose good
  const handleToggleLoose = (loose: boolean) => {
    setIsLoose(loose);
    if (loose && unit === 'packet') {
      setUnit('kg');
    } else if (!loose && unit === 'kg') {
      setUnit('packet');
    }
  };

  if (!isOpen) return null;

  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const marginPercent = sell > 0 ? Math.round(((sell - cost) / sell) * 100 * 10) / 10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (sell <= 0) {
      setError('Selling price must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData: ProductFormData = {
        name: name.trim(),
        kannadaName: kannadaName.trim() || null,
        barcode: barcode.trim() || null,
        categoryId: categoryId ? Number(categoryId) : null,
        isLoose,
        unit: unit.trim().toLowerCase(),
        costPrice: cost,
        sellingPrice: sell,
        mrp: parseFloat(mrp) || sell,
        currentStock: parseFloat(currentStock) || 0,
        minStockAlert: parseFloat(minStockAlert) || 5,
      };

      await onSubmit(formData, productToEdit?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-stone-950" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                {productToEdit ? 'Edit Product Details' : 'Add New Store Product'}
              </h3>
              <p className="text-xs text-stone-900/80">
                {productToEdit ? 'ಉತ್ಪನ್ನದ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ' : 'ಹೊಸ ಸರಕು ಸೇರಿಸಿ'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Type Selection */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-900 block">Product Type</span>
              <span className="text-[11px] text-stone-500">
                Packaged (fixed unit) or Loose Good (sold by weight/kg)
              </span>
            </div>
            <div className="flex rounded-lg bg-stone-200/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleToggleLoose(false)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  !isLoose
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Packaged Item
              </button>
              <button
                type="button"
                onClick={() => handleToggleLoose(true)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  isLoose
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Loose Good (kg)
              </button>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">
                Product Name (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sona Masoori Rice"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">
                Kannada Name (ಕನ್ನಡ ಹೆಸರು)
              </label>
              <input
                type="text"
                value={kannadaName}
                onChange={(e) => setKannadaName(e.target.value)}
                placeholder="ಉದಾ. ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Stock Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
              >
                <option value="packet">packet (ಪ್ಯಾಕೆಟ್)</option>
                <option value="kg">kg (ಕಿಲೋಗ್ರಾಂ)</option>
                <option value="g">gram (ಗ್ರಾಂ)</option>
                <option value="litre">litre (ಲೀಟರ್)</option>
                <option value="ml">ml (ಮಿಲಿ)</option>
                <option value="piece">piece (ತುಂಡು)</option>
                <option value="box">box (ಪೆಟ್ಟಿಗೆ)</option>
              </select>
            </div>
          </div>

          {/* Barcode */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-stone-700">Barcode / SKU</label>
              {isLoose && !barcode && (
                <span className="text-[10px] text-amber-700 font-medium">
                  Auto-generates LOOSE-XXX if left empty
                </span>
              )}
            </div>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder={isLoose ? 'Auto LOOSE-XXX or custom code' : 'e.g. 8901030383112'}
              className="w-full p-2.5 font-mono bg-stone-50 border border-stone-300 rounded-lg text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            />
          </div>

          {/* Prices & Profit Margin Box */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Pricing & Profit Margin
              </span>
              <div className="flex items-center gap-1 text-xs font-bold">
                <Percent className="w-3.5 h-3.5 text-amber-700" />
                <span className={marginPercent >= 15 ? 'text-emerald-700' : marginPercent > 5 ? 'text-amber-800' : 'text-rose-700'}>
                  Margin: {marginPercent}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600">Cost Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded font-mono text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-400 rounded font-mono text-xs font-bold text-amber-950 ring-1 ring-amber-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">
                {productToEdit ? 'Current Stock' : 'Initial Stock Quantity'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs font-bold"
              />
            </div>
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
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
