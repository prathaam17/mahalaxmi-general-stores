import React, { useState } from 'react';
import { Scale, X, Check } from 'lucide-react';
import type { ProductItem, CartItem } from '../../types';

interface LooseGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  looseProducts: ProductItem[];
  onAddLooseItem: (item: CartItem) => void;
}

export const LooseGoodsModal: React.FC<LooseGoodsModalProps> = ({
  isOpen,
  onClose,
  looseProducts,
  onAddLooseItem,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    looseProducts[0] || null
  );
  const [calcMode, setCalcMode] = useState<'KG' | 'GRAMS' | 'AMOUNT'>('KG');
  const [inputValue, setInputValue] = useState<string>('1');

  if (!isOpen) return null;

  const currentProduct = selectedProduct || looseProducts[0];
  const ratePerKg = currentProduct?.sellingPrice || 0;

  // Compute calculated quantity (in kg) and total price
  let qtyKg = 0;
  let totalPrice = 0;
  const numInput = parseFloat(inputValue) || 0;

  if (calcMode === 'KG') {
    qtyKg = Math.round(numInput * 1000) / 1000;
    totalPrice = Math.round(qtyKg * ratePerKg * 100) / 100;
  } else if (calcMode === 'GRAMS') {
    qtyKg = Math.round((numInput / 1000) * 1000) / 1000;
    totalPrice = Math.round(qtyKg * ratePerKg * 100) / 100;
  } else if (calcMode === 'AMOUNT') {
    totalPrice = Math.round(numInput * 100) / 100;
    qtyKg = ratePerKg > 0 ? Math.round((totalPrice / ratePerKg) * 1000) / 1000 : 0;
  }

  const handleAdd = () => {
    if (!currentProduct || qtyKg <= 0 || totalPrice <= 0) return;

    onAddLooseItem({
      productId: currentProduct.id,
      productName: currentProduct.name,
      kannadaName: currentProduct.kannadaName,
      quantity: qtyKg,
      unit: currentProduct.unit || 'kg',
      unitPrice: ratePerKg,
      costPrice: currentProduct.costPrice,
      lineTotal: totalPrice,
      isLoose: true,
    });

    onClose();
  };

  const setPreset = (kgValue: number) => {
    setCalcMode('KG');
    setInputValue(String(kgValue));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-stone-950" />
            <div>
              <h3 className="font-bold text-base leading-tight">Loose Goods / Weight Entry</h3>
              <p className="text-xs text-stone-900/80">ತೂಕ ಮತ್ತು ಬಿಡಿ ಸರಕುಗಳ ಲೆಕ್ಕಾಚಾರ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600/50 text-stone-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Product Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Select Loose Good • ಸರಕು ಆಯ್ಕೆ
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-stone-200 rounded-lg">
              {looseProducts.map((p) => {
                const isSelected = currentProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(p);
                    }}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 font-bold text-stone-950 ring-1 ring-amber-400'
                        : 'border-stone-100 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="truncate">{p.name}</div>
                    {p.kannadaName && (
                      <div className="text-[10px] text-stone-500 font-normal truncate">
                        {p.kannadaName}
                      </div>
                    )}
                    <div className="text-amber-700 font-bold mt-1">₹{p.sellingPrice} / kg</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Calculation Mode Tabs */}
          <div className="space-y-2">
            <div className="flex rounded-lg bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCalcMode('KG')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  calcMode === 'KG'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Weight (kg)
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('GRAMS')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  calcMode === 'GRAMS'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Grams (g)
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('AMOUNT')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  calcMode === 'AMOUNT'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Rupees (₹)
              </button>
            </div>

            {/* Input Field */}
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={calcMode === 'KG' ? 'e.g. 1.5' : calcMode === 'GRAMS' ? 'e.g. 500' : 'e.g. 50'}
                className="w-full text-2xl font-bold p-3.5 pl-4 pr-16 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-stone-900 font-mono tracking-tight"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                {calcMode === 'KG' ? 'kg' : calcMode === 'GRAMS' ? 'grams' : '₹ INR'}
              </span>
            </div>
          </div>

          {/* Quick Presets for retail provisions */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Common Weights
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '100g', val: 0.1 },
                { label: '250g', val: 0.25 },
                { label: '500g', val: 0.5 },
                { label: '1 kg', val: 1.0 },
                { label: '2 kg', val: 2.0 },
                { label: '5 kg', val: 5.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPreset(p.val)}
                  className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-md border border-stone-200 font-medium transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Live Calculated Result Preview */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Item & Rate:</span>
              <span className="font-semibold text-stone-900">
                {currentProduct?.name} @ ₹{ratePerKg}/kg
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Calculated Weight:</span>
              <span className="font-bold text-stone-900">
                {qtyKg} kg ({Math.round(qtyKg * 1000)} grams)
              </span>
            </div>
            <div className="border-t border-amber-200 pt-2 flex items-center justify-between">
              <span className="font-bold text-stone-900 text-sm">Line Total:</span>
              <span className="text-2xl font-black text-amber-950 font-mono">
                ₹{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={qtyKg <= 0 || totalPrice <= 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-sm shadow-sm transition-colors"
          >
            <Check className="w-4 h-4 text-stone-950" />
            <span>Add to Bill</span>
            <span className="font-mono text-xs">(₹{totalPrice.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
