import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  RefreshCw,
  Search,
  Calculator,
  Banknote,
  QrCode,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  History,
  Unlock,
} from 'lucide-react';
import {
  fetchExpensesList,
  fetchExpenseMetrics,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchCashRegister,
  setOpeningCash,
  closeCashRegister,
  reopenCashRegister,
  fetchCashHistory,
} from '../services/api';
import { ExpenseModal, EXPENSE_CATEGORIES } from '../components/expenses/ExpenseModal';
import { OpeningCashModal } from '../components/expenses/OpeningCashModal';
import { CashDrawerModal } from '../components/expenses/CashDrawerModal';
import { StatCard } from '../components/ui/StatCard';
import type {
  ExpenseItem,
  ExpenseMetrics,
  ExpenseFormData,
  CashRegisterSummary,
  CashRegisterDenominations,
  CashRegisterHistoryItem,
} from '../types';

export const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'drawer'>('expenses');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [metrics, setMetrics] = useState<ExpenseMetrics | null>(null);
  const [cashRegister, setCashRegister] = useState<CashRegisterSummary | null>(null);
  const [cashHistory, setCashHistory] = useState<CashRegisterHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);

  const [isOpeningCashModalOpen, setIsOpeningCashModalOpen] = useState<boolean>(false);
  const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [expList, expMetrics, regData, historyData] = await Promise.all([
        fetchExpensesList({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          paymentMode: selectedPaymentMode !== 'all' ? selectedPaymentMode : undefined,
        }),
        fetchExpenseMetrics(),
        fetchCashRegister(),
        fetchCashHistory(),
      ]);

      setExpenses(expList);
      setMetrics(expMetrics);
      setCashRegister(regData);
      setCashHistory(historyData);
    } catch (err: unknown) {
      console.error('Failed to load expenses data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to local shop database');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedPaymentMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Expense (Create or Edit)
  const handleSaveExpense = async (formData: ExpenseFormData & { id?: number; expenseDate: string }) => {
    if (formData.id) {
      await updateExpense(formData.id, formData);
    } else {
      await createExpense(formData);
    }
    await loadData();
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (item: ExpenseItem) => {
    if (confirm(`Are you sure you want to delete expense "${item.description}" (₹${item.amount.toFixed(2)})?`)) {
      try {
        await deleteExpense(item.id);
        await loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete expense');
      }
    }
  };

  // Handle Opening Cash
  const handleSaveOpeningCash = async (date: string, amount: number, notes?: string) => {
    await setOpeningCash(date, amount, notes);
    await loadData();
  };

  // Handle Close Register
  const handleCloseRegister = async (
    date: string,
    denominations: CashRegisterDenominations,
    closingNotes?: string
  ) => {
    await closeCashRegister(date, denominations, closingNotes);
    await loadData();
  };

  // Handle Reopen Register
  const handleReopenRegister = async () => {
    if (!cashRegister) return;
    if (confirm(`Do you want to reopen the cash register for ${cashRegister.registerDate}?`)) {
      try {
        await reopenCashRegister(cashRegister.registerDate);
        await loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to reopen register');
      }
    }
  };

  // Client-side search filter
  const filteredExpenses = expenses.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.paymentMode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Expenses & Cash Drawer
            </h1>
            <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              ದೈನಂದಿನ ಖರ್ಚುಗಳು & ಕ್ಯಾಶ್ ಡ್ರಾಯರ್
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Track daily store expenses, petty cash, and reconcile physical cash drawer at shop close
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsOpeningCashModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Opening Float • ಆರಂಭಿಕ ನಗದು</span>
          </button>

          <button
            onClick={() => setIsCashDrawerModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all shadow-sm hover:shadow"
          >
            <Calculator className="w-4 h-4" />
            <span>Reconcile Drawer • ದಿನದ ಲೆಕ್ಕ ಮುಕ್ತಾಯ</span>
          </button>

          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Expenses"
          value={metrics ? `₹${metrics.todayTotal.toFixed(2)}` : '—'}
          subtitle="ಇಂದಿನ ಒಟ್ಟು ಖರ್ಚು"
          icon={Wallet}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-800"
          accentBorder={Boolean(metrics && metrics.todayTotal > 0)}
        />

        <StatCard
          title="Cash Spent Today"
          value={metrics ? `₹${metrics.todayCash.toFixed(2)}` : '—'}
          subtitle="Petty cash from drawer"
          icon={Banknote}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-700"
        />

        <StatCard
          title="Expenses This Month"
          value={metrics ? `₹${metrics.monthTotal.toFixed(2)}` : '—'}
          subtitle={metrics?.topCategory ? `Top: ${metrics.topCategory.category}` : 'Monthly total'}
          icon={Calendar}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
        />

        <StatCard
          title="Expected Drawer Cash"
          value={cashRegister ? `₹${cashRegister.expectedCash.toFixed(2)}` : '—'}
          subtitle={cashRegister?.status === 'CLOSED' ? 'Register Closed' : 'Live drawer balance'}
          icon={Calculator}
          iconBgColor={cashRegister?.status === 'CLOSED' ? 'bg-emerald-50' : 'bg-stone-100'}
          iconColor={cashRegister?.status === 'CLOSED' ? 'text-emerald-700' : 'text-stone-800'}
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
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'expenses'
              ? 'text-amber-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span>Daily Expenses & Petty Cash ({expenses.length})</span>
          </div>
          {activeTab === 'expenses' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('drawer')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'drawer'
              ? 'text-amber-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            <span>Cash Drawer Reconciliation & History</span>
          </div>
          {activeTab === 'drawer' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Daily Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px] shrink-0 mr-1">
              Category:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              All Categories
            </button>
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Expenses Table Container */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Search toolbar */}
            <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search description, category, or mode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Payment:</span>
                <select
                  value={selectedPaymentMode}
                  onChange={(e) => setSelectedPaymentMode(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Modes</option>
                  <option value="CASH">Cash only</option>
                  <option value="UPI">UPI only</option>
                  <option value="BANK_TRANSFER">Bank only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Mode</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        {loading ? 'Loading expenses...' : 'No expenses match the current filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap">
                          {item.expenseDate}
                        </td>

                        <td className="py-3 px-4 font-semibold text-stone-900 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-stone-800">{item.description}</span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {item.paymentMode === 'CASH' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Banknote className="w-3 h-3" /> CASH
                            </span>
                          ) : item.paymentMode === 'UPI' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              <QrCode className="w-3 h-3" /> UPI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              BANK
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                          ₹{item.amount.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setExpenseToEdit(item);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteExpense(item)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cash Drawer Reconciliation & History */}
      {activeTab === 'drawer' && cashRegister && (
        <div className="space-y-6">
          {/* Today's Cash Register Status Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-stone-900">
                    Daily Cash Register • {cashRegister.registerDate}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      cashRegister.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    {cashRegister.status === 'CLOSED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> CLOSED FOR DAY
                      </>
                    ) : (
                      'REGISTER OPEN'
                    )}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Opening Float: ₹{cashRegister.openingCash.toFixed(2)}
                  {cashRegister.closedAt ? ` • Closed at ${new Date(cashRegister.closedAt).toLocaleTimeString()}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cashRegister.status === 'CLOSED' ? (
                  <button
                    onClick={handleReopenRegister}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen Register</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCashDrawerModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Reconcile & Close Day</span>
                  </button>
                )}
              </div>
            </div>

            {/* Financial Reconciliation Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Inflow Card */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                  Cash Inflow • ನಗದು ಜಮಾ
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between text-stone-700">
                    <span>Cash Sales:</span>
                    <span className="font-mono font-bold text-emerald-700">+₹{cashRegister.cashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Udhaar Repayments:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +₹{cashRegister.cashUdhaarCollections.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/80 flex justify-between font-bold text-emerald-950">
                    <span>Total Cash In:</span>
                    <span className="font-mono text-sm">+₹{cashRegister.totalCashIn.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Outflow Card */}
              <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2 text-xs">
                <span className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                  Cash Outflow • ನಗದು ಖರ್ಚು
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between text-stone-700">
                    <span>Cash Expenses:</span>
                    <span className="font-mono font-bold text-rose-700">-₹{cashRegister.cashExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Supplier Payments:</span>
                    <span className="font-mono font-bold text-rose-700">
                      -₹{cashRegister.cashSupplierPayments.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-rose-200/80 flex justify-between font-bold text-rose-950">
                    <span>Total Cash Out:</span>
                    <span className="font-mono text-sm">-₹{cashRegister.totalCashOut.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Expected & Counted Card */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-300 space-y-2 text-xs">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  Reconciliation Summary • ಲೆಕ್ಕ ವಿವರ
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between text-stone-700">
                    <span>Expected Cash:</span>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{cashRegister.expectedCash.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Actual Physical Count:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {cashRegister.closingCash != null ? `₹${cashRegister.closingCash.toFixed(2)}` : 'Not counted yet'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-amber-300 flex justify-between font-black text-amber-950">
                    <span>Difference (Diff):</span>
                    <span
                      className={`font-mono text-sm ${
                        cashRegister.difference == null
                          ? 'text-stone-500'
                          : cashRegister.difference === 0
                          ? 'text-emerald-700'
                          : cashRegister.difference > 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {cashRegister.difference != null
                        ? cashRegister.difference > 0
                          ? `+₹${cashRegister.difference.toFixed(2)}`
                          : `₹${cashRegister.difference.toFixed(2)}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Denomination summary if closed */}
            {cashRegister.status === 'CLOSED' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                  Physical Denominations Recorded:
                </span>
                <div className="flex flex-wrap gap-3 mt-1 font-mono text-stone-700">
                  <span>500 x {cashRegister.denominations.note500}</span>
                  <span>200 x {cashRegister.denominations.note200}</span>
                  <span>100 x {cashRegister.denominations.note100}</span>
                  <span>50 x {cashRegister.denominations.note50}</span>
                  <span>20 x {cashRegister.denominations.note20}</span>
                  <span>10 x {cashRegister.denominations.note10}</span>
                  <span>Coins: ₹{cashRegister.denominations.coins.toFixed(2)}</span>
                </div>
                {cashRegister.closingNotes && (
                  <p className="mt-2 text-stone-600 text-[11px] italic">
                    Notes: &quot;{cashRegister.closingNotes}&quot;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Past Days Cash Register History Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-600" />
                <span>Cash Register History • ಹಿಂದಿನ ದಿನಗಳ ಮುಕ್ತಾಯ ಲೆಕ್ಕ</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Opening (₹)</th>
                    <th className="py-2.5 px-4 text-right">Expected (₹)</th>
                    <th className="py-2.5 px-4 text-right">Physical Count (₹)</th>
                    <th className="py-2.5 px-4 text-right">Difference (₹)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {cashHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        No previous cash register closing records.
                      </td>
                    </tr>
                  ) : (
                    cashHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-stone-900">
                          {item.registerDate}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono">
                          ₹{item.openingCash.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold">
                          ₹{item.expectedCash.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800">
                          {item.closingCash != null ? `₹${item.closingCash.toFixed(2)}` : '—'}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold">
                          {item.difference != null ? (
                            <span
                              className={
                                item.difference === 0
                                  ? 'text-emerald-700'
                                  : item.difference > 0
                                  ? 'text-blue-700'
                                  : 'text-rose-700'
                              }
                            >
                              {item.difference > 0
                                ? `+₹${item.difference.toFixed(2)}`
                                : `₹${item.difference.toFixed(2)}`}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'CLOSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal (Create/Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
        onSave={handleSaveExpense}
      />

      {/* Opening Cash Modal */}
      <OpeningCashModal
        isOpen={isOpeningCashModalOpen}
        onClose={() => setIsOpeningCashModalOpen(false)}
        currentOpeningCash={cashRegister ? cashRegister.openingCash : 1000}
        date={cashRegister ? cashRegister.registerDate : new Date().toISOString().split('T')[0]}
        onSave={handleSaveOpeningCash}
      />

      {/* Cash Drawer Reconciliation Modal */}
      <CashDrawerModal
        isOpen={isCashDrawerModalOpen}
        onClose={() => setIsCashDrawerModalOpen(false)}
        summary={cashRegister}
        onCloseRegister={handleCloseRegister}
      />
    </div>
  );
};
