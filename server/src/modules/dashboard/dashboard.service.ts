import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../../db/index.js';

export interface DashboardSummary {
  shopInfo: {
    shopName: string;
    tagline: string;
    address: string;
    phone: string;
    gstin: string;
    currencySymbol: string;
    isDemoMode: boolean;
  };
  metrics: {
    todaySalesAmount: number;
    todayBillsCount: number;
    todayCashAmount: number;
    todayUpiAmount: number;
    todayCreditAmount: number;
    todayExpensesAmount: number;
    estimatedGrossProfit: number;
    totalOutstandingCredit: number;
    creditCustomerCount: number;
    lowStockCount: number;
  };
  lowStockItems: Array<{
    id: number;
    name: string;
    kannadaName: string | null;
    unit: string;
    currentStock: number;
    minStockAlert: number;
  }>;
  recentBills: Array<{
    id: number;
    billNumber: string;
    customerName: string | null;
    grandTotal: number;
    paymentMode: string;
    paymentStatus: string;
    totalItems: number;
    createdAt: string;
  }>;
  isDemoData: boolean;
}

export class DashboardService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  getSummary(): DashboardSummary {
    // 1. Fetch shop settings
    const settings = this.db.prepare('SELECT * FROM shop_settings WHERE id = 1').get() as {
      shop_name: string;
      tagline: string;
      address: string;
      phone: string;
      gstin: string;
      currency_symbol: string;
      is_demo_mode: number;
    } | undefined;

    // 2. Sales metrics for today (active non-reversed bills)
    const salesRow = this.db.prepare(`
      SELECT
        COUNT(id) as billCount,
        COALESCE(SUM(grand_total), 0) as totalAmount,
        COALESCE(SUM(cash_received - change_returned), 0) as cashAmount,
        COALESCE(SUM(upi_received), 0) as upiAmount,
        COALESCE(SUM(credit_added), 0) as creditAmount
      FROM bills
      WHERE is_reversed = 0
        AND DATE(created_at) = DATE('now', 'localtime')
    `).get() as {
      billCount: number;
      totalAmount: number;
      cashAmount: number;
      upiAmount: number;
      creditAmount: number;
    };

    // 3. Estimated gross profit for today
    const profitRow = this.db.prepare(`
      SELECT
        COALESCE(SUM(bi.line_total - (bi.cost_price * bi.quantity)), 0) as grossProfit
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.is_reversed = 0
        AND DATE(b.created_at) = DATE('now', 'localtime')
    `).get() as { grossProfit: number };

    // 4. Expenses for today
    const expenseRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalExpenses
      FROM expenses
      WHERE expense_date = DATE('now', 'localtime')
    `).get() as { totalExpenses: number };

    // 5. Total outstanding customer credit (Udhaar)
    const creditRow = this.db.prepare(`
      SELECT
        COALESCE(SUM(current_balance), 0) as totalCredit,
        COUNT(CASE WHEN current_balance > 0 THEN 1 END) as creditCustomers
      FROM customers
      WHERE is_active = 1
    `).get() as { totalCredit: number; creditCustomers: number };

    // 6. Low stock items (stock <= min_stock_alert)
    const lowStockItems = this.db.prepare(`
      SELECT id, name, kannada_name as kannadaName, unit, current_stock as currentStock, min_stock_alert as minStockAlert
      FROM products
      WHERE is_active = 1 AND current_stock <= min_stock_alert
      ORDER BY current_stock ASC
      LIMIT 10
    `).all() as Array<{
      id: number;
      name: string;
      kannadaName: string | null;
      unit: string;
      currentStock: number;
      minStockAlert: number;
    }>;

    const lowStockCountRow = this.db.prepare(`
      SELECT COUNT(id) as count
      FROM products
      WHERE is_active = 1 AND current_stock <= min_stock_alert
    `).get() as { count: number };

    // 7. Recent 5 bills
    const recentBills = this.db.prepare(`
      SELECT
        b.id,
        b.bill_number as billNumber,
        c.name as customerName,
        b.grand_total as grandTotal,
        b.payment_mode as paymentMode,
        b.payment_status as paymentStatus,
        b.total_items as totalItems,
        b.created_at as createdAt
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.is_reversed = 0
      ORDER BY b.id DESC
      LIMIT 5
    `).all() as Array<{
      id: number;
      billNumber: string;
      customerName: string | null;
      grandTotal: number;
      paymentMode: string;
      paymentStatus: string;
      totalItems: number;
      createdAt: string;
    }>;

    return {
      shopInfo: {
        shopName: settings?.shop_name || 'Mahalaxmi General Stores',
        tagline: settings?.tagline || 'Provisions & Daily Essentials',
        address: settings?.address || 'Main Road, Honnavar, Uttara Kannada, Karnataka - 581334',
        phone: settings?.phone || '+91 94800 12345',
        gstin: settings?.gstin || '',
        currencySymbol: settings?.currency_symbol || '₹',
        isDemoMode: Boolean(settings?.is_demo_mode ?? 1),
      },
      metrics: {
        todaySalesAmount: Number(salesRow?.totalAmount || 0),
        todayBillsCount: Number(salesRow?.billCount || 0),
        todayCashAmount: Number(salesRow?.cashAmount || 0),
        todayUpiAmount: Number(salesRow?.upiAmount || 0),
        todayCreditAmount: Number(salesRow?.creditAmount || 0),
        todayExpensesAmount: Number(expenseRow?.totalExpenses || 0),
        estimatedGrossProfit: Number(profitRow?.grossProfit || 0),
        totalOutstandingCredit: Number(creditRow?.totalCredit || 0),
        creditCustomerCount: Number(creditRow?.creditCustomers || 0),
        lowStockCount: Number(lowStockCountRow?.count || 0),
      },
      lowStockItems,
      recentBills,
      isDemoData: true,
    };
  }
}
