import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Scale,
  Trash2,
  Plus,
  Minus,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  User,
  ShoppingBag,
  AlertCircle,
  RotateCcw,
  Check,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { searchProducts, fetchCustomers, createSaleBill } from '../services/api';
import { LooseGoodsModal } from '../components/billing/LooseGoodsModal';
import { ReceiptModal } from '../components/billing/ReceiptModal';
import type { ProductItem, CartItem, Customer, BillDetail } from '../types';

export const BillingPage: React.FC = () => {
  // Search & Products
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  // Customer & Handwritten Slip Ref
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [slipNumber, setSlipNumber] = useState<string>('');

  // Payment
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CREDIT' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Feedback
  const [isLooseModalOpen, setIsLooseModalOpen] = useState(false);
  const [completedBill, setCompletedBill] = useState<BillDetail | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastSaleSuccess, setLastSaleSuccess] = useState<{
    billNumber: string;
    slipNumber?: string | null;
    grandTotal: number;
    paymentMode: string;
    customerName?: string | null;
  } | null>(null);

  // Load initial products and customers
  useEffect(() => {
    searchProducts('')
      .then((data) => setAllProducts(data))
      .catch((err) => console.error('Failed to load initial products:', err));

    fetchCustomers('')
      .then((data) => setCustomers(data))
      .catch((err) => console.error('Failed to load customers:', err));
  }, []);

  // Autofocus search on load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchProducts(searchQuery)
        .then((results) => {
          setSearchResults(results);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Totals calculations
  const subtotal = Math.round(cart.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const tenderedAmount = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, Math.round((tenderedAmount - grandTotal) * 100) / 100);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // Add product to cart
  const addToCart = useCallback((product: ProductItem, customQty?: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === product.id);
      const qtyToAdd = customQty !== undefined ? customQty : 1;

      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = Math.round((item.quantity + qtyToAdd) * 1000) / 1000;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          lineTotal: Math.round(newQty * item.unitPrice * 100) / 100,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            barcode: product.barcode,
            productName: product.name,
            kannadaName: product.kannadaName,
            quantity: qtyToAdd,
            unit: product.unit,
            unitPrice: product.sellingPrice,
            costPrice: product.costPrice,
            lineTotal: Math.round(qtyToAdd * product.sellingPrice * 100) / 100,
            isLoose: product.isLoose,
          },
        ];
      }
    });

    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  }, []);

  // Update item quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const roundedQty = Math.round(newQty * 1000) / 1000;
      updated[index] = {
        ...item,
        quantity: roundedQty,
        lineTotal: Math.round(roundedQty * item.unitPrice * 100) / 100,
      };
      return updated;
    });
  };

  // Remove item
  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear bill
  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashTendered('');
    setSelectedCustomerId(null);
    setSlipNumber('');
    setErrorMessage(null);
    searchInputRef.current?.focus();
  };

  // Barcode / exact search enter handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        addToCart(searchResults[0]);
      } else if (searchQuery.trim()) {
        searchProducts(searchQuery).then((results) => {
          if (results.length > 0) {
            addToCart(results[0]);
          }
        });
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Handle bill checkout submission
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the cart before checkout.');
      return;
    }

    if (paymentMode === 'CREDIT' && !selectedCustomerId) {
      setErrorMessage('Please select a customer for Udhaar (Credit) billing.');
      return;
    }

    if (paymentMode === 'CASH') {
      if (tenderedAmount > 0 && tenderedAmount < grandTotal) {
        setErrorMessage(`Tendered cash (₹${tenderedAmount}) is less than the bill total (₹${grandTotal}).`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const bill = await createSaleBill({
        customerId: selectedCustomerId,
        slipNumber: slipNumber.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          costPrice: item.costPrice,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        discount,
        taxAmount: 0,
        paymentMode,
        cashReceived: paymentMode === 'CASH' ? (tenderedAmount > 0 ? tenderedAmount : grandTotal) : 0,
        upiReceived: paymentMode === 'UPI' ? grandTotal : 0,
        creditAdded: paymentMode === 'CREDIT' ? grandTotal : 0,
      });

      setCompletedBill(bill);
      setLastSaleSuccess({
        billNumber: bill.billNumber,
        slipNumber: bill.slipNumber,
        grandTotal: bill.grandTotal,
        paymentMode: bill.paymentMode,
        customerName: bill.customerName,
      });
      setIsReceiptModalOpen(false); // Handwritten billing: No intrusive popup!
      handleClearCart();
      setSlipNumber('');

      // Refresh customers list to reflect updated Udhaar balances
      fetchCustomers('').then((data) => setCustomers(data));
      searchInputRef.current?.focus();
    } catch (err: unknown) {
      console.error('Sale completion error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record sale bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut for billing actions (F4 Payment, F9 Print/Complete)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleCompleteSale();
      } else if (e.key === 'Escape' && !isLooseModalOpen && !isReceiptModalOpen) {
        if (searchQuery) {
          setSearchQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [handleCompleteSale, isLooseModalOpen, isReceiptModalOpen, searchQuery]);

  const looseProducts = allProducts.filter((p) => p.isLoose);

  return (
    <div className="space-y-4">
      {/* Success Notification for Handwritten Billing */}
      {lastSaleSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 font-bold" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-emerald-950 flex flex-wrap items-center gap-2">
                <span>ಮಾರಾಟ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ (Sale Saved)!</span>
                <span className="font-mono text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                  {lastSaleSuccess.billNumber}
                </span>
                {lastSaleSuccess.slipNumber && (
                  <span className="font-mono text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold border border-amber-200">
                    ಚೀಟಿ: {lastSaleSuccess.slipNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                ₹{lastSaleSuccess.grandTotal.toFixed(2)} ({lastSaleSuccess.paymentMode}) {lastSaleSuccess.customerName ? `• ${lastSaleSuccess.customerName}` : ''} • ದಾಸ್ತಾನು ಮತ್ತು ನಗದು ದಾಖಲು ನವೀಕರಿಸಲಾಗಿದೆ (Stock & drawer updated).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-2.5 py-1 text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              title="View or print receipt slip if customer requests"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ರಸೀದಿ ನೋಡಿ (View Slip)</span>
            </button>
            <button
              type="button"
              onClick={() => setLastSaleSuccess(null)}
              className="p-1 hover:bg-emerald-200 rounded text-emerald-700 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Notification / Error */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search & Cart Table (7 / 12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Search & Loose Goods Button Bar */}
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or type name (e.g. Sona Masoori, Sugar, ಹಾಲು)..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Autocomplete Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-stone-200 z-30 max-h-72 overflow-y-auto divide-y divide-stone-100">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="w-full text-left p-3 hover:bg-amber-50/70 transition-colors flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                            {product.name}
                          </span>
                          {product.isLoose && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] rounded font-bold">
                              Loose (kg)
                            </span>
                          )}
                        </div>
                        {product.kannadaName && (
                          <div className="text-xs text-stone-500">{product.kannadaName}</div>
                        )}
                        <div className="text-[11px] text-stone-400 font-mono">
                          Stock: {product.currentStock} {product.unit} • Barcode: {product.barcode || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-stone-900 text-sm">
                          ₹{product.sellingPrice}
                          <span className="text-[10px] font-normal text-stone-500">/{product.unit}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                          + Add
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loose Goods Calculator Button */}
            <button
              type="button"
              onClick={() => setIsLooseModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-lg border border-amber-300 transition-colors shrink-0 shadow-2xs"
              title="Calculate Loose Goods (Rice, Sugar, Dal by weight/Rupees)"
            >
              <Scale className="w-4 h-4 text-amber-800" />
              <span className="hidden sm:inline">Loose Goods</span>
            </button>
          </div>

          {/* Cart Table Container */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col min-h-[380px]">
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Current Sale Items ({cart.length})
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600 font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-stone-800 text-sm">Cart is currently empty</p>
                  <p className="text-xs text-stone-500 max-w-xs">
                    Scan a barcode, type a product name above, or click on popular store goods below:
                  </p>
                </div>

                {/* Quick Add Chips for Fast Retail Flow */}
                <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
                  {allProducts.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-stone-950 text-xs font-medium border border-stone-200 transition-colors"
                    >
                      <span>{p.name}</span>
                      <span className="text-stone-500 font-normal ml-1 font-mono">
                        (₹{p.sellingPrice})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Item Name</th>
                      <th className="px-3 py-2.5 text-right">Rate</th>
                      <th className="px-3 py-2.5 text-center">Qty / Weight</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                      <th className="px-3 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-stone-900">{item.productName}</div>
                          {item.kannadaName && (
                            <div className="text-[10px] text-stone-500">{item.kannadaName}</div>
                          )}
                          <span className="text-[10px] text-stone-400 font-mono">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-stone-700">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  idx,
                                  item.isLoose ? item.quantity - 0.25 : item.quantity - 1
                                )
                              }
                              className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              step={item.isLoose ? '0.05' : '1'}
                              min="0.01"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(idx, parseFloat(e.target.value) || 0)}
                              className="w-14 text-center font-bold font-mono py-1 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  idx,
                                  item.isLoose ? item.quantity + 0.25 : item.quantity + 1
                                )
                              }
                              className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-stone-900 font-mono">
                          ₹{item.lineTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout, Customer & Payment (5 / 12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Customer Selection Box */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                <span>Customer Selection • ಗ್ರಾಹಕರು</span>
              </label>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="text-[11px] text-amber-700 hover:underline font-semibold"
                >
                  Reset to Walk-in
                </button>
              )}
            </div>

            <select
              value={selectedCustomerId ?? ''}
              onChange={(e) =>
                setSelectedCustomerId(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-300"
            >
              <option value="">Walk-in Counter Customer (ಸಾಮಾನ್ಯ ಗ್ರಾಹಕ)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No Phone'}) — Balance: ₹{c.currentBalance}
                </option>
              ))}
            </select>

            {/* Selected Customer Credit Info Pill */}
            {selectedCustomer && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-amber-950">
                  <span>Current Udhaar Balance:</span>
                  <span className="font-bold text-rose-700">₹{selectedCustomer.currentBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-600">
                  <span>Credit Limit:</span>
                  <span>₹{selectedCustomer.creditLimit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-600">
                  <span>Available Credit:</span>
                  <span className="font-bold text-emerald-700">₹{selectedCustomer.availableCredit.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Handwritten Slip Reference (Optional for paper bill books) */}
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>ಹಸ್ತಪ್ರತಿ ಚೀಟಿ ಸಂಖ್ಯೆ (Slip # - Optional)</span>
                </span>
                <span className="text-[10px] text-stone-400">Paper Bill Book</span>
              </label>
              <input
                type="text"
                value={slipNumber}
                onChange={(e) => setSlipNumber(e.target.value)}
                placeholder="e.g. Slip #42, Book 2/15..."
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono placeholder:text-stone-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
              />
            </div>
          </div>

          {/* 2. Bill Summary & Grand Total */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items):</span>
                <span className="font-bold font-mono text-stone-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-20 text-right p-1 font-mono text-xs border border-stone-300 rounded focus:ring-1 focus:ring-amber-300"
                />
              </div>
            </div>

            <div className="border-t border-stone-200 pt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Grand Total
                </span>
                <span className="text-[10px] text-stone-400">ಒಟ್ಟು ಮೊತ್ತ</span>
              </div>
              <div className="text-3xl font-black text-stone-950 font-mono tracking-tight">
                ₹{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 3. Payment Mode & Rapid Cash Tender */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-3">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Payment Method • ಪಾವತಿ ವಿಧಾನ
            </label>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-bold transition-all ${
                  paymentMode === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600 mb-1" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-bold transition-all ${
                  paymentMode === 'UPI'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-300'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-indigo-600 mb-1" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CREDIT')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-bold transition-all ${
                  paymentMode === 'CREDIT'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-300'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-600 mb-1" />
                <span>Udhaar</span>
              </button>
            </div>

            {/* Mode Specific Inputs */}
            {paymentMode === 'CASH' && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-stone-700">Cash Received (₹):</span>
                    <button
                      type="button"
                      onClick={() => setCashTendered(String(grandTotal))}
                      className="text-amber-700 hover:underline text-[11px] font-bold"
                    >
                      Exact (₹{grandTotal})
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={`e.g. ${grandTotal}`}
                    className="w-full text-lg font-bold p-2.5 font-mono border border-stone-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300"
                  />
                </div>

                {/* Quick Indian Rupee Currency Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashTendered(String(val))}
                      className="px-2 py-1 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded border border-stone-200 text-xs font-mono font-medium transition-colors"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                {/* Change Calculation Display */}
                {tenderedAmount > grandTotal && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Change to Return</span>
                      <span className="text-[10px] text-emerald-800">ಗ್ರಾಹಕರಿಗೆ ಹಿಂತಿರುಗಿಸಬೇಕಾದ ಹಣ</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-800 font-mono">
                      ₹{changeToReturn.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMode === 'UPI' && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1 text-center">
                <QrCode className="w-8 h-8 text-indigo-600 mx-auto" />
                <p className="font-bold">Scan QR code at store counter</p>
                <p className="text-[11px] text-indigo-700">PhonePe / Google Pay / Paytm (₹{grandTotal.toFixed(2)})</p>
              </div>
            )}

            {paymentMode === 'CREDIT' && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-1">
                <p className="font-bold">Udhaar Account Sale</p>
                <p className="text-[11px] text-amber-800">
                  {selectedCustomer
                    ? `Amount of ₹${grandTotal.toFixed(2)} will be added to ${selectedCustomer.name}'s account balance.`
                    : '⚠️ Please select a customer above before completing an Udhaar sale.'}
                </p>
              </div>
            )}
          </div>

          {/* 4. Complete Sale CTA Button */}
          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-amber-300"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-stone-950" />
                <span>ಮಾರಾಟ ದಾಖಲಿಸಿ (Save Sale & Next)</span>
                <span className="text-xs font-mono font-bold bg-amber-600/40 text-stone-950 px-2 py-0.5 rounded">
                  F9
                </span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-stone-500">
            ✓ ಹಸ್ತಪ್ರತಿ ಬಿಲ್ ಮೋಡ್ (Handwritten Bill Mode): Instantly updates stock, cash & Udhaar without print popups.
          </p>
        </div>
      </div>

      {/* Loose Goods Modal */}
      <LooseGoodsModal
        isOpen={isLooseModalOpen}
        onClose={() => setIsLooseModalOpen(false)}
        looseProducts={looseProducts}
        onAddLooseItem={(item) => {
          setCart((prev) => [...prev, item]);
          searchInputRef.current?.focus();
        }}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          searchInputRef.current?.focus();
        }}
        bill={completedBill}
        onNewBill={() => {
          setIsReceiptModalOpen(false);
          handleClearCart();
          searchInputRef.current?.focus();
        }}
      />
    </div>
  );
};
