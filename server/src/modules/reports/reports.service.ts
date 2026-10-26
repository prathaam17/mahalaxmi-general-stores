import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../../db/index.js';

export interface SalesReportFilter {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
}

export interface DailyTrendItem {
  date: string;
  totalSales: number;
  totalBills: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface TopProductItem {
  productId: number | null;
  productName: string;
  unit: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercent: number;
}

export interface CategorySalesItem {
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  grossProfit: number;
}

export interface PaymentBreakdown {
  cashAmount: number;
  upiAmount: number;
  creditAmount: number;
  cashPercent: number;
  upiPercent: number;
  creditPercent: number;
}

export interface SalesReportSummary {
  period: string;
  startDate: string;
  endDate: string;
  metrics: {
    totalGrossSales: number;
    totalDiscount: number;
    totalNetSales: number;
    totalBillsCount: number;
    totalItemsSold: number;
    cogs: number;
    estimatedGrossProfit: number;
    grossMarginPercent: number;
    totalOperatingExpenses: number;
    estimatedNetProfit: number;
    netMarginPercent: number;
    averageBillValue: number;
  };
  payments: PaymentBreakdown;
  dailyTrends: DailyTrendItem[];
  topProducts: TopProductItem[];
  categoryBreakdown: CategorySalesItem[];
}

export class ReportsService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  getSalesReport(filters: SalesReportFilter = {}): SalesReportSummary {
    const today = new Date().toISOString().split('T')[0];
    let startDate = filters.startDate;
    let endDate = filters.endDate || today;

    // Handle quick periods if dates not explicitly given
    if (!startDate) {
      if (filters.period === 'today') {
        startDate = today;
        endDate = today;
      } else if (filters.period === 'week') {
        // Last 7 days
        const d = new Date();
        d.setDate(d.getDate() - 6);
        startDate = d.toISOString().split('T')[0];
      } else if (filters.period === 'year') {
        startDate = `${today.substring(0, 4)}-01-01`;
      } else {
        // Default to this month
        startDate = `${today.substring(0, 7)}-01`;
      }
    }

    // 1. Overall Sales & COGS metrics
    const salesSummary = this.db.prepare(`
      SELECT
        COUNT(DISTINCT b.id) as totalBills,
        COALESCE(SUM(b.subtotal), 0) as grossSales,
        COALESCE(SUM(b.discount), 0) as discount,
        COALESCE(SUM(b.grand_total), 0) as netSales,
        COALESCE(SUM(b.cash_received - b.change_returned), 0) as cashReceived,
        COALESCE(SUM(b.upi_received), 0) as upiReceived,
        COALESCE(SUM(b.credit_added), 0) as creditAdded
      FROM bills b
      WHERE b.is_reversed = 0
        AND DATE(b.created_at, 'localtime') >= ?
        AND DATE(b.created_at, 'localtime') <= ?
    `).get(startDate, endDate) as {
      totalBills: number;
      grossSales: number;
      discount: number;
      netSales: number;
      cashReceived: number;
      upiReceived: number;
      creditAdded: number;
    };

    const itemsSummary = this.db.prepare(`
      SELECT
        COALESCE(SUM(bi.quantity), 0) as totalItems,
        COALESCE(SUM(bi.quantity * bi.cost_price), 0) as totalCogs
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      WHERE b.is_reversed = 0
        AND DATE(b.created_at, 'localtime') >= ?
        AND DATE(b.created_at, 'localtime') <= ?
    `).get(startDate, endDate) as {
      totalItems: number;
      totalCogs: number;
    };

    // 2. Total operating expenses in period
    const expensesRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalExpenses
      FROM expenses
      WHERE expense_date >= ?
        AND expense_date <= ?
    `).get(startDate, endDate) as { totalExpenses: number };

    const totalGrossSales = Math.round(Number(salesSummary.grossSales) * 100) / 100;
    const totalDiscount = Math.round(Number(salesSummary.discount) * 100) / 100;
    const totalNetSales = Math.round(Number(salesSummary.netSales) * 100) / 100;
    const totalBillsCount = Number(salesSummary.totalBills);
    const totalItemsSold = Math.round(Number(itemsSummary.totalItems) * 100) / 100;
    const cogs = Math.round(Number(itemsSummary.totalCogs) * 100) / 100;

    const estimatedGrossProfit = Math.round((totalNetSales - cogs) * 100) / 100;
    const grossMarginPercent = totalNetSales > 0
      ? Math.round((estimatedGrossProfit / totalNetSales) * 1000) / 10
      : 0;

    const totalOperatingExpenses = Math.round(Number(expensesRow.totalExpenses) * 100) / 100;
    const estimatedNetProfit = Math.round((estimatedGrossProfit - totalOperatingExpenses) * 100) / 100;
    const netMarginPercent = totalNetSales > 0
      ? Math.round((estimatedNetProfit / totalNetSales) * 1000) / 10
      : 0;

    const averageBillValue = totalBillsCount > 0
      ? Math.round((totalNetSales / totalBillsCount) * 100) / 100
      : 0;

    // Payments
    const cashAmount = Math.max(0, Math.round(Number(salesSummary.cashReceived) * 100) / 100);
    const upiAmount = Math.round(Number(salesSummary.upiReceived) * 100) / 100;
    const creditAmount = Math.round(Number(salesSummary.creditAdded) * 100) / 100;
    const sumPayments = cashAmount + upiAmount + creditAmount;

    const payments: PaymentBreakdown = {
      cashAmount,
      upiAmount,
      creditAmount,
      cashPercent: sumPayments > 0 ? Math.round((cashAmount / sumPayments) * 100) : 0,
      upiPercent: sumPayments > 0 ? Math.round((upiAmount / sumPayments) * 100) : 0,
      creditPercent: sumPayments > 0 ? Math.round((creditAmount / sumPayments) * 100) : 0,
    };

    // 3. Daily trends
    const dailyRows = this.db.prepare(`
      SELECT
        DATE(b.created_at, 'localtime') as dayDate,
        COUNT(DISTINCT b.id) as billsCount,
        COALESCE(SUM(b.grand_total), 0) as daySales,
        COALESCE(SUM(bi.quantity * bi.cost_price), 0) as dayCogs
      FROM bills b
      JOIN bill_items bi ON bi.bill_id = b.id
      WHERE b.is_reversed = 0
        AND DATE(b.created_at, 'localtime') >= ?
        AND DATE(b.created_at, 'localtime') <= ?
      GROUP BY dayDate
      ORDER BY dayDate ASC
    `).all(startDate, endDate) as Array<{
      dayDate: string;
      billsCount: number;
      daySales: number;
      dayCogs: number;
    }>;

    // Get daily expenses mapping
    const dailyExpRows = this.db.prepare(`
      SELECT
        expense_date as dayDate,
        COALESCE(SUM(amount), 0) as dayExpenses
      FROM expenses
      WHERE expense_date >= ?
        AND expense_date <= ?
      GROUP BY dayDate
    `).all(startDate, endDate) as Array<{ dayDate: string; dayExpenses: number }>;

    const expMap = Object.fromEntries(dailyExpRows.map((e) => [e.dayDate, Number(e.dayExpenses)]));

    const dailyTrends: DailyTrendItem[] = dailyRows.map((r) => {
      const sales = Math.round(Number(r.daySales) * 100) / 100;
      const dayCogs = Math.round(Number(r.dayCogs) * 100) / 100;
      const gross = Math.round((sales - dayCogs) * 100) / 100;
      const exp = expMap[r.dayDate] || 0;
      const net = Math.round((gross - exp) * 100) / 100;

      return {
        date: r.dayDate,
        totalSales: sales,
        totalBills: Number(r.billsCount),
        cogs: dayCogs,
        grossProfit: gross,
        expenses: exp,
        netProfit: net,
      };
    });

    // 4. Top selling products
    const topProdRows = this.db.prepare(`
      SELECT
        bi.product_id as productId,
        bi.product_name as productName,
        bi.unit,
        COALESCE(SUM(bi.quantity), 0) as quantitySold,
        COALESCE(SUM(bi.line_total), 0) as totalRevenue,
        COALESCE(SUM(bi.quantity * bi.cost_price), 0) as totalCost
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      WHERE b.is_reversed = 0
        AND DATE(b.created_at, 'localtime') >= ?
        AND DATE(b.created_at, 'localtime') <= ?
      GROUP BY bi.product_name, bi.unit
      ORDER BY totalRevenue DESC
      LIMIT 15
    `).all(startDate, endDate) as Array<{
      productId: number | null;
      productName: string;
      unit: string;
      quantitySold: number;
      totalRevenue: number;
      totalCost: number;
    }>;

    const topProducts: TopProductItem[] = topProdRows.map((p) => {
      const rev = Math.round(Number(p.totalRevenue) * 100) / 100;
      const cost = Math.round(Number(p.totalCost) * 100) / 100;
      const profit = Math.round((rev - cost) * 100) / 100;
      const margin = rev > 0 ? Math.round((profit / rev) * 1000) / 10 : 0;

      return {
        productId: p.productId,
        productName: p.productName,
        unit: p.unit,
        quantitySold: Math.round(Number(p.quantitySold) * 100) / 100,
        totalRevenue: rev,
        totalCost: cost,
        grossProfit: profit,
        profitMarginPercent: margin,
      };
    });

    // 5. Category breakdown
    const catRows = this.db.prepare(`
      SELECT
        COALESCE(c.name, 'General') as categoryName,
        COALESCE(SUM(bi.quantity), 0) as quantitySold,
        COALESCE(SUM(bi.line_total), 0) as totalRevenue,
        COALESCE(SUM(bi.line_total - (bi.quantity * bi.cost_price)), 0) as grossProfit
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      LEFT JOIN products p ON p.id = bi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE b.is_reversed = 0
        AND DATE(b.created_at, 'localtime') >= ?
        AND DATE(b.created_at, 'localtime') <= ?
      GROUP BY categoryName
      ORDER BY totalRevenue DESC
    `).all(startDate, endDate) as Array<{
      categoryName: string;
      quantitySold: number;
      totalRevenue: number;
      grossProfit: number;
    }>;

    const categoryBreakdown: CategorySalesItem[] = catRows.map((c) => ({
      categoryName: c.categoryName,
      quantitySold: Math.round(Number(c.quantitySold) * 100) / 100,
      totalRevenue: Math.round(Number(c.totalRevenue) * 100) / 100,
      grossProfit: Math.round(Number(c.grossProfit) * 100) / 100,
    }));

    return {
      period: filters.period || 'custom',
      startDate,
      endDate,
      metrics: {
        totalGrossSales,
        totalDiscount,
        totalNetSales,
        totalBillsCount,
        totalItemsSold,
        cogs,
        estimatedGrossProfit,
        grossMarginPercent,
        totalOperatingExpenses,
        estimatedNetProfit,
        netMarginPercent,
        averageBillValue,
      },
      payments,
      dailyTrends,
      topProducts,
      categoryBreakdown,
    };
  }
}
