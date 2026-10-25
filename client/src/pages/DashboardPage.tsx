import React from 'react';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  Scale,
  PlusCircle,
  Receipt,
  UserCheck,
  Server,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import type { DashboardSummary, AppModule } from '../types';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  onNavigate: (module: AppModule) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  loading,
  error,
  onNavigate,
  onRefresh,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentVariant = (mode: string) => {
    switch (mode.toUpperCase()) {
      case 'CASH':
        return 'cash' as const;
      case 'UPI':
        return 'upi' as const;
      case 'CREDIT':
        return 'credit' as const;
      default:
        return 'info' as const;
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-600 font-medium">Connecting to Mahalaxmi local store database...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-lg">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Local Database Connection Error</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const metrics = summary?.metrics;
  const shopInfo = summary?.shopInfo;

  return (
    <div className="space-y-6">
      {/* 1. Realistic Demo Data Notice Banner */}
      {summary?.isDemoData && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 text-sm tracking-wide">
                  DEMO DATA MODE ACTIVE
                </span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Sample Store
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                The figures and inventory below are realistic demonstration samples for Mahalaxmi General Stores, Honnavar. Real financial records will begin accumulating once you complete your first live sale.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('billing')}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Start Test Bill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Quick Retail Action Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Quick Actions • ಕೌಂಟರ್ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳು
          </h2>
          <span className="text-xs text-stone-400 font-mono hidden sm:inline">Keyboard friendly</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('billing')}
            className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-sm transition-all focus:ring-2 focus:ring-amber-400"
          >
            <PlusCircle className="w-5 h-5 text-stone-950" />
            <div className="text-left">
              <div>New Bill</div>
              <div className="text-[10px] text-stone-900/80 font-mono font-normal">Shortcut: F2</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm border border-stone-200 transition-all"
          >
            <Scale className="w-5 h-5 text-amber-600" />
            <div className="text-left">
              <div>Loose Goods</div>
              <div className="text-[10px] text-stone-500 font-normal">Weight / Manual kg</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm border border-stone-200 transition-all"
          >
            <CreditCard className="w-5 h-5 text-sky-600" />
            <div className="text-left">
              <div>Udhaar Repayment</div>
              <div className="text-[10px] text-stone-500 font-normal">ಗ್ರಾಹಕರ ಪಾವತಿ</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm border border-stone-200 transition-all"
          >
            <Receipt className="w-5 h-5 text-rose-600" />
            <div className="text-left">
              <div>Shop Expense</div>
              <div className="text-[10px] text-stone-500 font-normal">ದೈನಂದಿನ ಖರ್ಚು</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(metrics?.todaySalesAmount || 0)}
          subtitle={`${metrics?.todayBillsCount || 0} bills completed today`}
          icon={IndianRupee}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-800"
          accentBorder={true}
        />

        <StatCard
          title="Cash in Drawer"
          value={formatCurrency(metrics?.todayCashAmount || 0)}
          subtitle="Net cash received"
          icon={Banknote}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-700"
        />

        <StatCard
          title="UPI / QR Collections"
          value={formatCurrency(metrics?.todayUpiAmount || 0)}
          subtitle="GPay, PhonePe, Paytm"
          icon={QrCode}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-700"
        />

        <StatCard
          title="Udhaar Given Today"
          value={formatCurrency(metrics?.todayCreditAmount || 0)}
          subtitle="Credit added to ledger"
          icon={CreditCard}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* 4. Secondary Business Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Estimated Gross Profit"
          value={formatCurrency(metrics?.estimatedGrossProfit || 0)}
          subtitle="Selling price minus cost price"
          icon={TrendingUp}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-700"
        />

        <StatCard
          title="Total Outstanding Udhaar"
          value={formatCurrency(metrics?.totalOutstandingCredit || 0)}
          subtitle={`Across ${metrics?.creditCustomerCount || 0} regular customers`}
          icon={UserCheck}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-700"
        />

        <StatCard
          title="Low Stock Alerts"
          value={metrics?.lowStockCount || 0}
          subtitle="Products below minimum reorder level"
          icon={AlertTriangle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* 5. Two Column Section: Recent Bills & Low Stock Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Bills (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-stone-900 text-sm">Recent Store Bills</h3>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-100 text-stone-500 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Bill No</th>
                  <th className="px-4 py-2.5">Customer / Note</th>
                  <th className="px-4 py-2.5">Mode</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {summary?.recentBills && summary.recentBills.length > 0 ? (
                  summary.recentBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-stone-800">
                        {bill.billNumber}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {bill.customerName ? (
                          <span className="font-medium">{bill.customerName}</span>
                        ) : (
                          <span className="text-stone-400">Walk-in Counter</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPaymentVariant(bill.paymentMode)} size="sm">
                          {bill.paymentMode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-stone-900">
                        {formatCurrency(bill.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-400 font-mono text-[11px]">
                        {bill.createdAt.split(' ')[1] || bill.createdAt}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                      No bills recorded yet. Click "New Bill" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Low Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-stone-900 text-sm">Low Stock Alert List</h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {summary?.lowStockItems && summary.lowStockItems.length > 0 ? (
              summary.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-stone-900 text-xs">{item.name}</p>
                    {item.kannadaName && (
                      <p className="text-[11px] text-stone-500">{item.kannadaName}</p>
                    )}
                    <p className="text-[10px] text-stone-400">
                      Minimum required: {item.minStockAlert} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                      {item.currentStock} {item.unit}
                    </span>
                    <p className="text-[10px] text-rose-600 font-medium mt-0.5">Needs Reorder</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-stone-400 text-xs">
                All inventory levels are currently sufficient.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Architecture & Local Offline System Information */}
      <div className="bg-stone-900 text-stone-300 rounded-xl p-5 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-800 rounded-lg text-amber-400 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                Local Shop Database: SQLite (WAL Mode)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Offline Capable
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Host: {shopInfo?.shopName || 'Mahalaxmi General Stores'} • {shopInfo?.address || 'Honnavar, Karnataka'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-400 bg-stone-950/80 px-3 py-2 rounded-lg border border-stone-800">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Local LAN Server • No internet needed for billing</span>
        </div>
      </div>
    </div>
  );
};
