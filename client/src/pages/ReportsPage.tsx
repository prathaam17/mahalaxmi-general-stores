import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Banknote,
  QrCode,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { fetchSalesReport } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import type { SalesReportSummary } from '../types';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'trends' | 'products' | 'categories'>('trends');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        period?: 'today' | 'week' | 'month' | 'year' | 'custom';
        startDate?: string;
        endDate?: string;
      } = { period };

      if (period === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const data = await fetchSalesReport(params);
      setReport(data);

      if (!startDate) setStartDate(data.startDate);
      if (!endDate) setEndDate(data.endDate);
    } catch (err: unknown) {
      console.error('Failed to load sales report:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to local shop database');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  const handlePresetPeriod = (p: 'today' | 'week' | 'month' | 'year') => {
    setPeriod(p);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Sales, Profit & Reports
            </h1>
            <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              ಮಾರಾಟ ಮತ್ತು ಲಾಭದ ವರದಿಗಳು
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Retail analytics, Gross & Net Profit estimation, top products, and retail statements
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-xs"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || !report}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print Retail Statement • ವರದಿ ಮುದ್ರಿಸಿ</span>
          </button>
        </div>
      </div>

      {/* Date Period Selector Toolbar (Screen Only) */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Period:</span>
          </span>

          <button
            onClick={() => handlePresetPeriod('today')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              period === 'today'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Today (ಇಂದು)
          </button>

          <button
            onClick={() => handlePresetPeriod('week')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              period === 'week'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Last 7 Days (ವಾರ)
          </button>

          <button
            onClick={() => handlePresetPeriod('month')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              period === 'month'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            This Month (ಈ ತಿಂಗಳು)
          </button>

          <button
            onClick={() => handlePresetPeriod('year')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              period === 'year'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            This Year (ವರ್ಷ)
          </button>

          <button
            onClick={() => setPeriod('custom')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              period === 'custom'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-stone-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b-2 border-stone-900 pb-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              MAHALAXMI GENERAL STORES
            </h1>
            <p className="text-xs font-semibold text-stone-700">
              ಮಹಾಲಕ್ಷ್ಮಿ ಜನರಲ್ ಸ್ಟೋರ್ಸ್ • Honnavar, Uttara Kannada, Karnataka - 581334
            </p>
            <p className="text-[11px] text-stone-500">
              GSTIN: 29AAAAA0000A1Z5 • Phone: +91 94801 23456
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-950 font-bold text-xs rounded">
              SALES & PROFIT RETAIL STATEMENT
            </span>
            <p className="text-xs text-stone-600 mt-1 font-mono">
              Period: {report?.startDate} to {report?.endDate}
            </p>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metrics Summary */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Net Sales"
            value={`₹${report.metrics.totalNetSales.toLocaleString('en-IN')}`}
            subtitle={`${report.metrics.totalBillsCount} bills • Avg ₹${report.metrics.averageBillValue.toFixed(0)}/bill`}
            icon={TrendingUp}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-800"
            accentBorder={true}
          />

          <StatCard
            title="Cost of Goods Sold (COGS)"
            value={`₹${report.metrics.cogs.toLocaleString('en-IN')}`}
            subtitle="Wholesale purchase cost of items sold"
            icon={ShoppingBag}
            iconBgColor="bg-stone-100"
            iconColor="text-stone-700"
          />

          <StatCard
            title="Estimated Gross Profit"
            value={`₹${report.metrics.estimatedGrossProfit.toLocaleString('en-IN')}`}
            subtitle={`Gross Margin: ${report.metrics.grossMarginPercent}%`}
            icon={DollarSign}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-700"
          />

          <StatCard
            title="Estimated Net Profit"
            value={`₹${report.metrics.estimatedNetProfit.toLocaleString('en-IN')}`}
            subtitle={`After ₹${report.metrics.totalOperatingExpenses.toFixed(0)} expenses (${report.metrics.netMarginPercent}%)`}
            icon={ArrowUpRight}
            iconBgColor={report.metrics.estimatedNetProfit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}
            iconColor={report.metrics.estimatedNetProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}
          />
        </div>
      )}

      {/* Payment Modes Distribution Card */}
      {report && (
        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Payment Collections Distribution • ಪಾವತಿ ವಿಧಾನಗಳ ಪಾಲು
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Total: ₹{report.metrics.totalNetSales.toFixed(2)}
            </span>
          </div>

          {/* Progress split bar */}
          <div className="h-3.5 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${report.payments.cashPercent}%` }}
              className="bg-emerald-500 transition-all"
              title={`Cash: ${report.payments.cashPercent}%`}
            />
            <div
              style={{ width: `${report.payments.upiPercent}%` }}
              className="bg-purple-500 transition-all"
              title={`UPI: ${report.payments.upiPercent}%`}
            />
            <div
              style={{ width: `${report.payments.creditPercent}%` }}
              className="bg-amber-500 transition-all"
              title={`Udhaar / Credit: ${report.payments.creditPercent}%`}
            />
          </div>

          {/* Payment chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-emerald-950">Cash • ನಗದು</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-emerald-900">₹{report.payments.cashAmount.toFixed(2)}</span>
                <span className="text-[10px] text-emerald-700 ml-1.5">({report.payments.cashPercent}%)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-700" />
                <span className="font-semibold text-purple-950">UPI / QR • ಜಿಪೇ</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-purple-900">₹{report.payments.upiAmount.toFixed(2)}</span>
                <span className="text-[10px] text-purple-700 ml-1.5">({report.payments.upiPercent}%)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-800" />
                <span className="font-semibold text-amber-950">Udhaar • ಉದ್ಧಾರ</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-amber-950">₹{report.payments.creditAmount.toFixed(2)}</span>
                <span className="text-[10px] text-amber-800 ml-1.5">({report.payments.creditPercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200 print:hidden">
        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'trends' ? 'text-amber-700' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Daily Sales & Profit Breakdown</span>
          </div>
          {activeTab === 'trends' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'products' ? 'text-amber-700' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Top-Selling Goods & Margins</span>
          </div>
          {activeTab === 'products' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-2 text-xs font-bold transition-all relative ${
            activeTab === 'categories' ? 'text-amber-700' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Category Revenue Breakdown</span>
          </div>
          {activeTab === 'categories' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Daily Trends Table */}
      {report && (
        <div className={`bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden ${activeTab === 'trends' ? 'block' : 'hidden print:block'}`}>
          <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
              Daily Sales & Net Profit Timeline • ದೈನಂದಿನ ಮಾರಾಟ & ಲಾಭ
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              {report.dailyTrends.length} days recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Bills</th>
                  <th className="py-3 px-4 text-right">Net Sales (₹)</th>
                  <th className="py-3 px-4 text-right">Cost (COGS ₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-4 text-right">Expenses (₹)</th>
                  <th className="py-3 px-4 text-right">Net Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {report.dailyTrends.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      No sales recorded in the selected date range.
                    </td>
                  </tr>
                ) : (
                  report.dailyTrends.map((day) => (
                    <tr key={day.date} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{day.date}</td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 font-semibold text-[11px]">
                          {day.totalBills}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        ₹{day.totalSales.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-stone-600">
                        ₹{day.cogs.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        ₹{day.grossProfit.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-rose-700">
                        ₹{day.expenses.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black">
                        <span className={day.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          ₹{day.netProfit.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Top Selling Products */}
      {report && (
        <div className={`bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden ${activeTab === 'products' ? 'block' : 'hidden print:block'}`}>
          <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
              Top-Selling Products by Revenue & Profit • ಹೆಚ್ಚು ಮಾರಾಟವಾದ ಸರಕುಗಳು
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              Top {report.topProducts.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-right">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Wholesale Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-4 text-right">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {report.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No products sold in this period.
                    </td>
                  </tr>
                ) : (
                  report.topProducts.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">{prod.productName}</td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-stone-800">
                        {prod.quantitySold} {prod.unit}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        ₹{prod.totalRevenue.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-stone-600">
                        ₹{prod.totalCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        ₹{prod.grossProfit.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-900">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-[11px]">
                          {prod.profitMarginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Category Breakdown */}
      {report && activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200/80 bg-stone-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
              Department & Category Revenue • ವಿಭಾಗವಾರು ಮಾರಾಟ
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              {report.categoryBreakdown.length} categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4 text-right">Items Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {report.categoryBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      No category data available.
                    </td>
                  </tr>
                ) : (
                  report.categoryBreakdown.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">{cat.categoryName}</td>

                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {cat.quantitySold}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        ₹{cat.totalRevenue.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        ₹{cat.grossProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Footer */}
      <div className="hidden print:block pt-8 border-t border-stone-300 mt-6 text-xs text-stone-600">
        <div className="flex justify-between items-center">
          <p>Mahalaxmi General Stores • Computer Generated Retail Statement</p>
          <p className="font-bold text-stone-800">Authorized Signature / ಮುದ್ರೆ</p>
        </div>
      </div>
    </div>
  );
};
