import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  PackagePlus,
  RefreshCw,
  Phone,
  MapPin,
  Building,
  CreditCard,
  BookOpen,
  Edit2,
  Trash2,
  AlertTriangle,
  Receipt,
  Eye,
  FileText,
  X,
} from 'lucide-react';
import {
  fetchSuppliersList,
  fetchSupplierMetrics,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  recordSupplierPayment,
  fetchSupplierStatement,
  fetchPurchasesList,
  recordSupplierPurchase,
  fetchProducts,
} from '../services/api';
import { SupplierModal } from '../components/suppliers/SupplierModal';
import { PurchaseModal } from '../components/suppliers/PurchaseModal';
import { SupplierPaymentModal } from '../components/suppliers/SupplierPaymentModal';
import { SupplierStatementModal } from '../components/suppliers/SupplierStatementModal';
import { StatCard } from '../components/ui/StatCard';
import type {
  SupplierWithMeta,
  SupplierMetrics,
  SupplierFormData,
  SupplierStatement,
  PurchaseDetail,
  PurchaseFormData,
  ProductWithCategory,
} from '../types';

export const SuppliersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases'>('suppliers');
  const [suppliers, setSuppliers] = useState<SupplierWithMeta[]>([]);
  const [purchases, setPurchases] = useState<PurchaseDetail[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [metrics, setMetrics] = useState<SupplierMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setCustomerToEdit] = useState<SupplierWithMeta | null>(null);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [defaultSupplierIdForPurchase, setDefaultSupplierIdForPurchase] = useState<number | undefined>(undefined);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [supplierToPay, setSupplierToPay] = useState<SupplierWithMeta | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<SupplierStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<PurchaseDetail | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasBalanceParam = balanceFilter === 'due' ? true : undefined;
      const [suppList, metricsData, purList, prodList] = await Promise.all([
        fetchSuppliersList(search.trim() || undefined, hasBalanceParam),
        fetchSupplierMetrics(),
        fetchPurchasesList(),
        fetchProducts(),
      ]);

      let filteredSuppliers = suppList;
      if (balanceFilter === 'cleared') {
        filteredSuppliers = suppList.filter((s) => s.currentBalance <= 0);
      }

      setSuppliers(filteredSuppliers);
      setMetrics(metricsData);
      setPurchases(purList);
      setProducts(prodList);
    } catch (err: unknown) {
      console.error('Failed to load suppliers data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to local store database');
    } finally {
      setLoading(false);
    }
  }, [search, balanceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle supplier create or edit
  const handleSaveSupplier = async (formData: SupplierFormData) => {
    if (supplierToEdit) {
      await updateSupplier(supplierToEdit.id, formData);
    } else {
      await createSupplier(formData);
    }
    await loadData();
  };

  // Handle record payment
  const handleRecordPayment = async (
    id: number,
    amount: number,
    paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER',
    notes?: string
  ) => {
    await recordSupplierPayment(id, amount, paymentMode, notes);
    await loadData();
  };

  // Open statement modal
  const handleOpenStatement = async (supplier: SupplierWithMeta) => {
    try {
      setIsStatementModalOpen(true);
      setStatementLoading(true);
      setStatementData(null);
      const data = await fetchSupplierStatement(supplier.id);
      setStatementData(data);
    } catch (err: unknown) {
      console.error('Failed to load statement:', err);
      alert(err instanceof Error ? err.message : 'Could not load statement');
      setIsStatementModalOpen(false);
    } finally {
      setStatementLoading(false);
    }
  };

  // Handle record purchase
  const handleSavePurchase = async (purchaseData: PurchaseFormData) => {
    await recordSupplierPurchase(purchaseData);
    await loadData();
    setActiveTab('purchases');
  };

  // Open Purchase modal for specific supplier
  const handleNewPurchaseForSupplier = (supplierId: number) => {
    setDefaultSupplierIdForPurchase(supplierId);
    setIsPurchaseModalOpen(true);
  };

  // Deactivate supplier
  const handleDeleteSupplier = async (supplier: SupplierWithMeta) => {
    if (supplier.currentBalance > 0) {
      alert(
        `Cannot deactivate "${supplier.name}" with an outstanding balance of ₹${supplier.currentBalance.toFixed(
          2
        )}. Please settle the balance first.`
      );
      return;
    }

    if (confirm(`Are you sure you want to deactivate supplier "${supplier.name}"?`)) {
      try {
        await deleteSupplier(supplier.id);
        await loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to deactivate supplier');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Suppliers & Purchases
            </h1>
            <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              ಸರಬರಾಜುದಾರರು ಮತ್ತು ಖರೀದಿ ವಿವರಗಳು
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Track distributors, stock inward deliveries, purchase invoices, and payable accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-xs"
            title="Refresh Suppliers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              setDefaultSupplierIdForPurchase(undefined);
              setIsPurchaseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all shadow-sm hover:shadow"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Record Stock Inward • ಸರಕು ಖರೀದಿ</span>
          </button>

          <button
            onClick={() => {
              setCustomerToEdit(null);
              setIsSupplierModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Suppliers"
          value={metrics ? metrics.totalSuppliers : '—'}
          subtitle="Registered distributors"
          icon={Truck}
          iconBgColor="bg-stone-100"
          iconColor="text-stone-700"
        />

        <StatCard
          title="Total Outstanding Payable"
          value={metrics ? `₹${metrics.totalPayableBalance.toLocaleString('en-IN')}` : '—'}
          subtitle="ಹಣ ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಬಾಕಿ"
          icon={Building}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-800"
          accentBorder={Boolean(metrics && metrics.totalPayableBalance > 0)}
        />

        <StatCard
          title="Suppliers with Due"
          value={metrics ? metrics.suppliersWithDueCount : '—'}
          subtitle="Pending settlements"
          icon={CreditCard}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-700"
        />

        <StatCard
          title="Purchases This Month"
          value={metrics ? `₹${metrics.purchasesThisMonth.toLocaleString('en-IN')}` : '—'}
          subtitle="Stock inward received"
          icon={Receipt}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
        />
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'suppliers'
              ? 'text-amber-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Suppliers & Payable Balances ({suppliers.length})</span>
          </div>
          {activeTab === 'suppliers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'purchases'
              ? 'text-amber-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Inward Invoices / History ({purchases.length})</span>
          </div>
          {activeTab === 'purchases' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Suppliers Directory Table */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search supplier, phone, or GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0">
                Filter:
              </span>
              <button
                onClick={() => setBalanceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  balanceFilter === 'all'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                All Suppliers
              </button>
              <button
                onClick={() => setBalanceFilter('due')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  balanceFilter === 'due'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Pending Balance Due
              </button>
              <button
                onClick={() => setBalanceFilter('cleared')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  balanceFilter === 'cleared'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Zero Balance (Cleared)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Supplier / Agency</th>
                  <th className="py-3 px-4">Phone & GSTIN</th>
                  <th className="py-3 px-4">Location / Town</th>
                  <th className="py-3 px-4 text-center">Inward Bills</th>
                  <th className="py-3 px-4 text-right">Payable Balance (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      {loading ? 'Loading suppliers...' : 'No suppliers match your search filter.'}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => {
                    const hasDue = supplier.currentBalance > 0;
                    return (
                      <tr key={supplier.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 text-sm">{supplier.name}</div>
                          {supplier.lastPurchaseDate && (
                            <span className="text-[10px] text-stone-500">
                              Last order: {supplier.lastPurchaseDate}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {supplier.phone ? (
                            <div className="flex items-center gap-1.5 text-stone-700">
                              <Phone className="w-3.5 h-3.5 text-stone-400" />
                              <span>{supplier.phone}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                          {supplier.gstin && (
                            <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                              GST: {supplier.gstin}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {supplier.address ? (
                            <div className="flex items-center gap-1.5 text-stone-600 max-w-xs truncate">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{supplier.address}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 font-semibold text-[11px] text-stone-700">
                            {supplier.totalPurchasesCount} orders
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          <div
                            className={`text-sm font-bold ${
                              hasDue ? 'text-amber-900 font-black' : 'text-stone-600'
                            }`}
                          >
                            ₹{supplier.currentBalance.toFixed(2)}
                          </div>
                          {hasDue ? (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded mt-0.5">
                              Due Payable
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                              Cleared
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Pay Supplier */}
                            {hasDue && (
                              <button
                                onClick={() => {
                                  setSupplierToPay(supplier);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs"
                                title="Pay Supplier"
                              >
                                Pay
                              </button>
                            )}

                            {/* Inward Stock shortcut */}
                            <button
                              onClick={() => handleNewPurchaseForSupplier(supplier.id)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                              title="Record Inward Stock from this supplier"
                            >
                              <PackagePlus className="w-3.5 h-3.5 text-amber-700" />
                            </button>

                            {/* Statement Passbook */}
                            <button
                              onClick={() => handleOpenStatement(supplier)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                              title="View Ledger Statement"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setCustomerToEdit(supplier);
                                setIsSupplierModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                              title="Edit Supplier Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Deactivate */}
                            <button
                              onClick={() => handleDeleteSupplier(supplier)}
                              disabled={hasDue}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                hasDue
                                  ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                                  : 'border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={
                                hasDue
                                  ? 'Cannot deactivate supplier with active payable balance'
                                  : 'Deactivate Supplier'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Recent Inward Purchases History */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Inward Purchase Invoices • ಖರೀದಿ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ({purchases.length})</span>
            </h3>
            <button
              onClick={() => {
                setDefaultSupplierIdForPurchase(undefined);
                setIsPurchaseModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>+ New Inward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      No purchase invoices recorded yet. Click &quot;Record Stock Inward&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => {
                    const statusBadgeClass =
                      purchase.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : purchase.paymentStatus === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200';

                    return (
                      <tr key={purchase.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {purchase.invoiceNumber}
                        </td>

                        <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap">
                          {purchase.purchaseDate}
                        </td>

                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {purchase.supplierName}
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-stone-700 max-w-xs truncate">
                            {purchase.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                          </div>
                          <span className="text-[10px] text-stone-500">
                            {purchase.totalItems} distinct item(s)
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                          ₹{purchase.grandTotal.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          <div className="font-semibold text-emerald-700">
                            ₹{purchase.paidAmount.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-stone-500 uppercase">
                            {purchase.paymentMode}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass}`}
                          >
                            {purchase.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedPurchaseDetail(purchase)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                            title="View Invoice Items"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Detail Modal */}
      {selectedPurchaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Invoice #{selectedPurchaseDetail.invoiceNumber}
                </h3>
                <p className="text-xs text-stone-400">
                  {selectedPurchaseDetail.supplierName} • {selectedPurchaseDetail.purchaseDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetail(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Cost Rate (₹)</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedPurchaseDetail.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-stone-900">{item.productName}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          ₹{item.unitCostPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          ₹{item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Grand Total:</span>
                  <span className="font-mono font-bold text-stone-900">
                    ₹{selectedPurchaseDetail.grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Amount Paid ({selectedPurchaseDetail.paymentMode}):</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{selectedPurchaseDetail.paidAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Remaining Payable on Credit:</span>
                  <span className="font-mono font-bold text-amber-900">
                    ₹{(selectedPurchaseDetail.grandTotal - selectedPurchaseDetail.paidAmount).toFixed(2)}
                  </span>
                </div>
                {selectedPurchaseDetail.notes && (
                  <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-200">
                    Remarks: {selectedPurchaseDetail.notes}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedPurchaseDetail(null)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal (Create / Edit) */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplierToEdit={supplierToEdit}
        onSave={handleSaveSupplier}
      />

      {/* Purchase Modal (Stock Inward) */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        suppliers={suppliers}
        products={products}
        defaultSupplierId={defaultSupplierIdForPurchase}
        onSave={handleSavePurchase}
      />

      {/* Supplier Payment Modal */}
      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        supplier={supplierToPay}
        onRecordPayment={handleRecordPayment}
      />

      {/* Supplier Statement Passbook Modal */}
      <SupplierStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        statement={statementData}
        loading={statementLoading}
      />
    </div>
  );
};
