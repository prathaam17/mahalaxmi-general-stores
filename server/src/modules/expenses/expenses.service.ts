import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from '../../db/index.js';

export interface ExpenseItem {
  id: number;
  category: string;
  description: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | string;
  expenseDate: string;
  createdAt: string;
}

export interface ExpenseFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMode?: string;
}

export interface ExpenseMetrics {
  todayTotal: number;
  todayCash: number;
  todayUpi: number;
  monthTotal: number;
  topCategory: { category: string; amount: number } | null;
  byCategory: Array<{ category: string; amount: number; count: number }>;
}

export interface CreateExpenseInput {
  category: string;
  description: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  expenseDate?: string;
}

export interface UpdateExpenseInput {
  category: string;
  description: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  expenseDate: string;
}

export interface CashRegisterDenominations {
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
  coins: number;
}

export interface CashRegisterSummary {
  id: number | null;
  registerDate: string;
  openingCash: number;
  cashSales: number;
  cashUdhaarCollections: number;
  cashExpenses: number;
  cashSupplierPayments: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  closingCash: number | null;
  difference: number | null;
  denominations: CashRegisterDenominations;
  status: 'OPEN' | 'CLOSED';
  closingNotes: string | null;
  closedAt: string | null;
  createdAt: string | null;
}

export class ExpensesService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  // ----------------------------------------------------
  // 1. Expenses CRUD & Metrics
  // ----------------------------------------------------

  getExpenses(filters: ExpenseFilter = {}): ExpenseItem[] {
    const conditions: string[] = ['1 = 1'];
    const params: Array<string | number | null | bigint | Uint8Array> = [];

    if (filters.startDate) {
      conditions.push('expense_date >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('expense_date <= ?');
      params.push(filters.endDate);
    }

    if (filters.category && filters.category !== 'all') {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters.paymentMode && filters.paymentMode !== 'all') {
      conditions.push('payment_mode = ?');
      params.push(filters.paymentMode);
    }

    const sql = `
      SELECT
        id,
        category,
        description,
        amount,
        payment_mode as paymentMode,
        expense_date as expenseDate,
        created_at as createdAt
      FROM expenses
      WHERE ${conditions.join(' AND ')}
      ORDER BY expense_date DESC, id DESC
    `;

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      category: string;
      description: string;
      amount: number;
      paymentMode: string;
      expenseDate: string;
      createdAt: string;
    }>;

    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
  }

  getExpenseMetrics(targetDate?: string): ExpenseMetrics {
    const today = targetDate || new Date().toISOString().split('T')[0];

    // Today's totals
    const todayRow = this.db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN amount ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN amount ELSE 0 END), 0) as upi
      FROM expenses
      WHERE expense_date = ?
    `).get(today) as { total: number; cash: number; upi: number };

    // Month's total
    const monthRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE expense_date >= DATE(?, 'start of month')
        AND expense_date <= ?
    `).get(today, today) as { total: number };

    // Breakdown by category (this month)
    const categoryRows = this.db.prepare(`
      SELECT
        category,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(id) as count
      FROM expenses
      WHERE expense_date >= DATE(?, 'start of month')
        AND expense_date <= ?
      GROUP BY category
      ORDER BY amount DESC
    `).all(today, today) as Array<{ category: string; amount: number; count: number }>;

    const byCategory = categoryRows.map((c) => ({
      category: c.category,
      amount: Number(c.amount),
      count: Number(c.count),
    }));

    const topCategory = byCategory.length > 0 ? { category: byCategory[0].category, amount: byCategory[0].amount } : null;

    return {
      todayTotal: Number(todayRow.total),
      todayCash: Number(todayRow.cash),
      todayUpi: Number(todayRow.upi),
      monthTotal: Number(monthRow.total),
      topCategory,
      byCategory,
    };
  }

  createExpense(input: CreateExpenseInput): ExpenseItem {
    const trimmedCat = input.category.trim();
    const trimmedDesc = input.description.trim();
    const amount = Number(input.amount);

    if (!trimmedCat) throw new Error('Expense category is required');
    if (!trimmedDesc) throw new Error('Expense description is required');
    if (isNaN(amount) || amount <= 0) throw new Error('Amount must be greater than zero');

    const todayStr = new Date().toISOString().split('T')[0];
    const date = input.expenseDate || todayStr;

    return runInTransaction(this.db, () => {
      const res = this.db.prepare(`
        INSERT INTO expenses (category, description, amount, payment_mode, expense_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(trimmedCat, trimmedDesc, amount, input.paymentMode, date);

      const id = Number(res.lastInsertRowid);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('CREATE_EXPENSE', 'EXPENSE', ?, ?)
      `).run(String(id), `Recorded expense of ₹${amount.toFixed(2)} for ${trimmedCat} (${input.paymentMode})`);

      const created = this.db.prepare(`
        SELECT
          id, category, description, amount,
          payment_mode as paymentMode,
          expense_date as expenseDate,
          created_at as createdAt
        FROM expenses
        WHERE id = ?
      `).get(id) as {
        id: number;
        category: string;
        description: string;
        amount: number;
        paymentMode: string;
        expenseDate: string;
        createdAt: string;
      };

      return {
        ...created,
        amount: Number(created.amount),
      };
    });
  }

  updateExpense(id: number, input: UpdateExpenseInput): ExpenseItem {
    const existing = this.db.prepare('SELECT id, description, amount FROM expenses WHERE id = ?').get(id);
    if (!existing) throw new Error(`Expense #${id} not found`);

    const trimmedCat = input.category.trim();
    const trimmedDesc = input.description.trim();
    const amount = Number(input.amount);

    if (!trimmedCat) throw new Error('Expense category is required');
    if (!trimmedDesc) throw new Error('Expense description is required');
    if (isNaN(amount) || amount <= 0) throw new Error('Amount must be greater than zero');

    return runInTransaction(this.db, () => {
      this.db.prepare(`
        UPDATE expenses
        SET category = ?, description = ?, amount = ?, payment_mode = ?, expense_date = ?
        WHERE id = ?
      `).run(trimmedCat, trimmedDesc, amount, input.paymentMode, input.expenseDate, id);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('UPDATE_EXPENSE', 'EXPENSE', ?, ?)
      `).run(String(id), `Updated expense #${id} to ₹${amount.toFixed(2)} (${trimmedCat})`);

      const updated = this.db.prepare(`
        SELECT
          id, category, description, amount,
          payment_mode as paymentMode,
          expense_date as expenseDate,
          created_at as createdAt
        FROM expenses
        WHERE id = ?
      `).get(id) as {
        id: number;
        category: string;
        description: string;
        amount: number;
        paymentMode: string;
        expenseDate: string;
        createdAt: string;
      };

      return {
        ...updated,
        amount: Number(updated.amount),
      };
    });
  }

  deleteExpense(id: number): void {
    const existing = this.db.prepare('SELECT id, description, amount FROM expenses WHERE id = ?').get(id) as {
      id: number;
      description: string;
      amount: number;
    } | undefined;

    if (!existing) throw new Error(`Expense #${id} not found`);

    runInTransaction(this.db, () => {
      this.db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('DELETE_EXPENSE', 'EXPENSE', ?, ?)
      `).run(String(id), `Deleted expense #${id} ("${existing.description}", ₹${Number(existing.amount).toFixed(2)})`);
    });
  }

  // ----------------------------------------------------
  // 2. Cash Drawer Tracking & Day Reconciliation
  // ----------------------------------------------------

  getCashRegisterForDate(targetDate?: string): CashRegisterSummary {
    const today = targetDate || new Date().toISOString().split('T')[0];

    // 1. Get or create daily_cash_register row
    let regRow = this.db.prepare(`
      SELECT * FROM daily_cash_register WHERE register_date = ?
    `).get(today) as {
      id: number;
      register_date: string;
      opening_cash: number;
      expected_cash: number;
      closing_cash: number | null;
      difference: number | null;
      note_500: number;
      note_200: number;
      note_100: number;
      note_50: number;
      note_20: number;
      note_10: number;
      coins: number;
      status: 'OPEN' | 'CLOSED';
      closing_notes: string | null;
      closed_at: string | null;
      created_at: string;
    } | undefined;

    // 2. Compute dynamic cash movements for that date
    // A. Cash retained from sales bills: cash_received - change_returned (on active bills created on date)
    const salesRow = this.db.prepare(`
      SELECT COALESCE(SUM(cash_received - change_returned), 0) as cashSales
      FROM bills
      WHERE is_reversed = 0
        AND DATE(created_at, 'localtime') = ?
    `).get(today) as { cashSales: number };

    // B. Cash received from customer credit repayments
    const udhaarRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as cashUdhaar
      FROM customer_ledger
      WHERE entry_type = 'CREDIT'
        AND payment_mode = 'CASH'
        AND DATE(created_at, 'localtime') = ?
    `).get(today) as { cashUdhaar: number };

    // C. Cash paid out for shop expenses
    const expRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as cashExpenses
      FROM expenses
      WHERE payment_mode = 'CASH'
        AND expense_date = ?
    `).get(today) as { cashExpenses: number };

    // D. Cash paid to suppliers
    const suppRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as cashSuppliers
      FROM supplier_ledger
      WHERE entry_type = 'DEBIT'
        AND payment_mode = 'CASH'
        AND DATE(created_at, 'localtime') = ?
    `).get(today) as { cashSuppliers: number };

    const openingCash = regRow ? Number(regRow.opening_cash) : 0;
    const cashSales = Math.round(Number(salesRow.cashSales) * 100) / 100;
    const cashUdhaarCollections = Math.round(Number(udhaarRow.cashUdhaar) * 100) / 100;
    const cashExpenses = Math.round(Number(expRow.cashExpenses) * 100) / 100;
    const cashSupplierPayments = Math.round(Number(suppRow.cashSuppliers) * 100) / 100;

    const totalCashIn = Math.round((cashSales + cashUdhaarCollections) * 100) / 100;
    const totalCashOut = Math.round((cashExpenses + cashSupplierPayments) * 100) / 100;
    const expectedCash = Math.round((openingCash + totalCashIn - totalCashOut) * 100) / 100;

    const denominations: CashRegisterDenominations = {
      note500: regRow ? Number(regRow.note_500) : 0,
      note200: regRow ? Number(regRow.note_200) : 0,
      note100: regRow ? Number(regRow.note_100) : 0,
      note50: regRow ? Number(regRow.note_50) : 0,
      note20: regRow ? Number(regRow.note_20) : 0,
      note10: regRow ? Number(regRow.note_10) : 0,
      coins: regRow ? Number(regRow.coins) : 0,
    };

    let closingCash: number | null = regRow?.closing_cash != null ? Number(regRow.closing_cash) : null;
    let difference: number | null = regRow?.difference != null ? Number(regRow.difference) : null;

    if (closingCash != null) {
      difference = Math.round((closingCash - expectedCash) * 100) / 100;
    }

    return {
      id: regRow ? regRow.id : null,
      registerDate: today,
      openingCash,
      cashSales,
      cashUdhaarCollections,
      cashExpenses,
      cashSupplierPayments,
      totalCashIn,
      totalCashOut,
      expectedCash,
      closingCash,
      difference,
      denominations,
      status: regRow ? regRow.status : 'OPEN',
      closingNotes: regRow ? regRow.closing_notes : null,
      closedAt: regRow ? regRow.closed_at : null,
      createdAt: regRow ? regRow.created_at : null,
    };
  }

  setOpeningCash(date: string, openingCash: number, notes?: string): CashRegisterSummary {
    const cash = Math.max(0, Number(openingCash) || 0);

    runInTransaction(this.db, () => {
      const existing = this.db.prepare('SELECT id FROM daily_cash_register WHERE register_date = ?').get(date) as {
        id: number;
      } | undefined;

      if (existing) {
        this.db.prepare(`
          UPDATE daily_cash_register
          SET opening_cash = ?, closing_notes = COALESCE(?, closing_notes), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(cash, notes || null, existing.id);
      } else {
        this.db.prepare(`
          INSERT INTO daily_cash_register (register_date, opening_cash, expected_cash, status, closing_notes)
          VALUES (?, ?, ?, 'OPEN', ?)
        `).run(date, cash, cash, notes || 'Morning drawer cash');
      }

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('SET_OPENING_CASH', 'DRAWER', ?, ?)
      `).run(date, `Set opening cash to ₹${cash.toFixed(2)} for ${date}`);
    });

    return this.getCashRegisterForDate(date);
  }

  closeCashRegister(input: {
    date: string;
    denominations: CashRegisterDenominations;
    closingNotes?: string;
  }): CashRegisterSummary {
    const { date, denominations, closingNotes } = input;

    // Calculate physical count
    const physicalCount =
      (denominations.note500 || 0) * 500 +
      (denominations.note200 || 0) * 200 +
      (denominations.note100 || 0) * 100 +
      (denominations.note50 || 0) * 50 +
      (denominations.note20 || 0) * 20 +
      (denominations.note10 || 0) * 10 +
      (denominations.coins || 0);

    const roundedCount = Math.round(physicalCount * 100) / 100;

    // Compute expected cash
    const currentSummary = this.getCashRegisterForDate(date);
    const expected = currentSummary.expectedCash;
    const diff = Math.round((roundedCount - expected) * 100) / 100;

    runInTransaction(this.db, () => {
      const existing = this.db.prepare('SELECT id FROM daily_cash_register WHERE register_date = ?').get(date) as {
        id: number;
      } | undefined;

      if (existing) {
        this.db.prepare(`
          UPDATE daily_cash_register
          SET
            expected_cash = ?,
            closing_cash = ?,
            difference = ?,
            note_500 = ?,
            note_200 = ?,
            note_100 = ?,
            note_50 = ?,
            note_20 = ?,
            note_10 = ?,
            coins = ?,
            status = 'CLOSED',
            closing_notes = ?,
            closed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          expected,
          roundedCount,
          diff,
          denominations.note500 || 0,
          denominations.note200 || 0,
          denominations.note100 || 0,
          denominations.note50 || 0,
          denominations.note20 || 0,
          denominations.note10 || 0,
          denominations.coins || 0,
          closingNotes?.trim() || null,
          existing.id
        );
      } else {
        this.db.prepare(`
          INSERT INTO daily_cash_register (
            register_date, opening_cash, expected_cash, closing_cash, difference,
            note_500, note_200, note_100, note_50, note_20, note_10, coins,
            status, closing_notes, closed_at
          ) VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CLOSED', ?, CURRENT_TIMESTAMP)
        `).run(
          date,
          expected,
          roundedCount,
          diff,
          denominations.note500 || 0,
          denominations.note200 || 0,
          denominations.note100 || 0,
          denominations.note50 || 0,
          denominations.note20 || 0,
          denominations.note10 || 0,
          denominations.coins || 0,
          closingNotes?.trim() || null
        );
      }

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('CLOSE_CASH_DRAWER', 'DRAWER', ?, ?)
      `).run(
        date,
        `Closed cash drawer for ${date}: Physical Count ₹${roundedCount.toFixed(2)}, Expected ₹${expected.toFixed(2)}, Diff: ₹${diff.toFixed(2)}`
      );
    });

    return this.getCashRegisterForDate(date);
  }

  reopenCashRegister(date: string): CashRegisterSummary {
    runInTransaction(this.db, () => {
      this.db.prepare(`
        UPDATE daily_cash_register
        SET status = 'OPEN', closed_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE register_date = ?
      `).run(date);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('REOPEN_CASH_DRAWER', 'DRAWER', ?, ?)
      `).run(date, `Reopened cash drawer for ${date}`);
    });

    return this.getCashRegisterForDate(date);
  }

  getCashRegisterHistory(limit = 30): Array<{
    id: number;
    registerDate: string;
    openingCash: number;
    expectedCash: number;
    closingCash: number | null;
    difference: number | null;
    status: 'OPEN' | 'CLOSED';
    closedAt: string | null;
  }> {
    const rows = this.db.prepare(`
      SELECT
        id,
        register_date as registerDate,
        opening_cash as openingCash,
        expected_cash as expectedCash,
        closing_cash as closingCash,
        difference,
        status,
        closed_at as closedAt
      FROM daily_cash_register
      ORDER BY register_date DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: number;
      registerDate: string;
      openingCash: number;
      expectedCash: number;
      closingCash: number | null;
      difference: number | null;
      status: 'OPEN' | 'CLOSED';
      closedAt: string | null;
    }>;

    return rows.map((r) => ({
      ...r,
      openingCash: Number(r.openingCash),
      expectedCash: Number(r.expectedCash),
      closingCash: r.closingCash != null ? Number(r.closingCash) : null,
      difference: r.difference != null ? Number(r.difference) : null,
    }));
  }
}
