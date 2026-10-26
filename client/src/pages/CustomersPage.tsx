import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  AlertTriangle,
  CreditCard,
  Banknote,
  BookOpen,
  Edit2,
  Trash2,
  RefreshCw,
  Phone,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import {
  fetchCustomersList,
  fetchCustomerMetrics,
  createCustomer,
  updateCustomer,
  recordCustomerPayment,
  fetchCustomerStatement,
  deactivateCustomer,
} from '../services/api';
import { CustomerModal } from '../components/customers/CustomerModal';
import { PaymentModal } from '../components/customers/PaymentModal';
import { CustomerStatementModal } from '../components/customers/CustomerStatementModal';
import { StatCard } from '../components/ui/StatCard';
import type {
  CustomerWithMeta,
  CustomerMetrics,
  CustomerFormData,
  CustomerStatement,
} from '../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithMeta[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'cleared' | 'overlimit'>('all');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerWithMeta | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [customerToPay, setCustomerToPay] = useState<CustomerWithMeta | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<CustomerStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasBalanceParam = balanceFilter === 'due' ? true : undefined;
      const [list, metricsData] = await Promise.all([
        fetchCustomersList(search.trim() || undefined, hasBalanceParam),
        fetchCustomerMetrics(),
      ]);

      // Apply client-side filters for cleared & overlimit if selected
      let filtered = list;
      if (balanceFilter === 'cleared') {
        filtered = list.filter((c) => c.currentBalance <= 0);
      } else if (balanceFilter === 'overlimit') {
        filtered = list.filter((c) => c.isOverLimit);
      }

      setCustomers(filtered);
      setMetrics(metricsData);
    } catch (err: unknown) {
      console.error('Failed to load customer Khata data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to customer ledger.');
    } finally {
      setLoading(false);
    }
  }, [search, balanceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: CustomerWithMeta) => {
    setCustomerToEdit(cust);
    setIsCustomerModalOpen(true);
  };

  const handleOpenPayment = (cust: CustomerWithMeta) => {
    setCustomerToPay(cust);
    setIsPaymentModalOpen(true);
  };

  const handleOpenStatement = async (cust: CustomerWithMeta) => {
    setIsStatementModalOpen(true);
    setStatementLoading(true);
    setStatementData(null);
    try {
      const data = await fetchCustomerStatement(cust.id);
      setStatementData(data);
    } catch (err) {
      console.error('Failed to fetch statement:', err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleCustomerSubmit = async (data: CustomerFormData, id?: number) => {
    if (id) {
      await updateCustomer(id, data);
    } else {
      await createCustomer(data);
    }
    await loadData();
  };

  const handlePaymentSubmit = async (
    id: number,
    amount: number,
    paymentMode: 'CASH' | 'UPI',
    notes?: string
  ) => {
    await recordCustomerPayment(id, amount, paymentMode, notes);
    await loadData();
  };

  const handleDeactivate = async (cust: CustomerWithMeta) => {
    if (cust.currentBalance > 0) {
      if (
        !window.confirm(
          `Customer "${cust.name}" has an active due balance of ₹${cust.currentBalance}. Are you sure you want to archive this account?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to deactivate "${cust.name}"?`)) {
        return;
      }
    }

    try {
      await deactivateCustomer(cust.id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate customer');
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt);
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900 leading-tight">
              Customer Credit & Udhaar Khata
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            ಗ್ರಾಹಕರ ಉದ್ಧಾರ ಖಾತೆ, ಜಮಾ ಪಾವತಿ & ಲೆಡ್ಜರ್ ವರದಿ • Ledger statements & repayments
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenAddCustomer}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Udhaar Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Outstanding Udhaar"
          value={formatCurrency(metrics?.totalOutstandingBalance || 0)}
          subtitle="Shop credit due across customers"
          icon={CreditCard}
          iconBgColor="bg-rose-100"
          iconColor="text-rose-700"
          accentBorder={true}
        />

        <StatCard
          title="Due Accounts"
          value={metrics?.customersWithDueCount || 0}
          subtitle="Customers with active balance > ₹0"
          icon={AlertTriangle}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-800"
        />

        <StatCard
          title="Total Regular Customers"
          value={metrics?.totalCustomers || 0}
          subtitle="Registered customer accounts"
          icon={Users}
          iconBgColor="bg-sky-100"
          iconColor="text-sky-700"
        />

        <StatCard
          title="Repayments Today"
          value={formatCurrency(metrics?.repaymentsCollectedToday || 0)}
          subtitle="Cash & UPI collected today"
          icon={Banknote}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-700"
        />
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone (+91...), or address..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            />
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setBalanceFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              balanceFilter === 'all'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Customers ({metrics?.totalCustomers || 0})
          </button>

          <button
            onClick={() => setBalanceFilter('due')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              balanceFilter === 'due'
                ? 'bg-rose-500 text-white font-bold shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Has Due Balance ({metrics?.customersWithDueCount || 0})
          </button>

          <button
            onClick={() => setBalanceFilter('cleared')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              balanceFilter === 'cleared'
                ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Cleared / Zero Balance
          </button>

          <button
            onClick={() => setBalanceFilter('overlimit')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              balanceFilter === 'overlimit'
                ? 'bg-amber-600 text-white font-bold shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Exceeded Credit Limit
          </button>
        </div>
      </div>

      {/* 4. Customer Directory Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Address / Area</th>
                <th className="px-3 py-3 text-right">Balance Due</th>
                <th className="px-3 py-3 text-right">Credit Limit</th>
                <th className="px-3 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading customer accounts...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600">No customers found.</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Click "+ Register Customer" above to open a new Khata account.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-stone-900 text-sm">{cust.name}</div>
                      {cust.lastTransactionDate && (
                        <div className="text-[10px] text-stone-400 font-mono">
                          Last activity: {cust.lastTransactionDate.split(' ')[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-stone-600">
                      {cust.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{cust.phone}</span>
                        </div>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-stone-600">
                      {cust.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{cust.address}</span>
                        </div>
                      ) : (
                        <span className="text-stone-300">Honnavar</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-mono font-bold text-sm">
                        {cust.currentBalance > 0 ? (
                          <span className="text-rose-700">₹{cust.currentBalance.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>₹0.00 (Cleared)</span>
                          </span>
                        )}
                      </div>
                      {cust.isOverLimit && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 mt-0.5">
                          Over Limit
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-stone-700">
                      ₹{cust.creditLimit.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-emerald-800">
                      ₹{cust.availableCredit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPayment(cust)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold border border-emerald-200 transition-colors"
                          title="Record Udhaar Repayment (ಜಮಾ)"
                        >
                          + Repay
                        </button>

                        <button
                          onClick={() => handleOpenStatement(cust)}
                          className="p-1.5 rounded text-stone-600 hover:bg-amber-100 hover:text-amber-900 transition-colors"
                          title="View & Print Khata Statement"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditCustomer(cust)}
                          className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeactivate(cust)}
                          className="p-1.5 rounded text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Deactivate Customer Account"
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

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={customerToEdit}
        onSubmit={handleCustomerSubmit}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={customerToPay}
        onRecordPayment={handlePaymentSubmit}
      />

      <CustomerStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        statement={statementData}
        loading={statementLoading}
      />
    </div>
  );
};
