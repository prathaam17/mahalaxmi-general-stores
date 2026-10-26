import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { ExpensesService } from '../src/modules/expenses/expenses.service.js';

describe('Expenses and Cash Drawer Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: ExpensesService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new ExpensesService(db);
  });

  it('retrieves expenses list and calculates expense metrics', () => {
    const list = service.getExpenses();
    expect(list.length).toBeGreaterThanOrEqual(2);

    const tea = list.find((e) => e.category === 'Tea & Refreshments');
    expect(tea).toBeDefined();
    expect(tea?.amount).toBe(60.0);
    expect(tea?.paymentMode).toBe('CASH');

    const metrics = service.getExpenseMetrics();
    expect(metrics.todayTotal).toBeGreaterThanOrEqual(210.0); // 60 + 150
    expect(metrics.todayCash).toBeGreaterThanOrEqual(60.0);
    expect(metrics.todayUpi).toBeGreaterThanOrEqual(150.0);
    expect(metrics.byCategory.length).toBeGreaterThan(0);
  });

  it('creates new expense and writes to audit log', () => {
    const created = service.createExpense({
      category: 'Helper Wages & Hamali',
      description: 'Hamali for unloading 20 bags of rice',
      amount: 250.0,
      paymentMode: 'CASH',
    });

    expect(created.id).toBeDefined();
    expect(created.category).toBe('Helper Wages & Hamali');
    expect(created.amount).toBe(250.0);

    const audit = db.prepare("SELECT * FROM audit_logs WHERE action = 'CREATE_EXPENSE' ORDER BY id DESC LIMIT 1").get() as {
      details: string;
    };
    expect(audit.details).toContain('₹250.00');
    expect(audit.details).toContain('Helper Wages & Hamali');
  });

  it('updates an existing expense', () => {
    const list = service.getExpenses();
    const first = list[0];

    const updated = service.updateExpense(first.id, {
      category: first.category,
      description: 'Updated description for expense',
      amount: 80.0,
      paymentMode: 'CASH',
      expenseDate: first.expenseDate,
    });

    expect(updated.id).toBe(first.id);
    expect(updated.amount).toBe(80.0);
    expect(updated.description).toBe('Updated description for expense');
  });

  it('deletes an expense and records in audit log', () => {
    const list = service.getExpenses();
    const countBefore = list.length;
    const toDelete = list[0];

    service.deleteExpense(toDelete.id);

    const countAfter = service.getExpenses().length;
    expect(countAfter).toBe(countBefore - 1);

    const audit = db.prepare("SELECT * FROM audit_logs WHERE action = 'DELETE_EXPENSE' ORDER BY id DESC LIMIT 1").get() as {
      details: string;
    };
    expect(audit.details).toContain(`Deleted expense #${toDelete.id}`);
  });

  it('computes live daily cash drawer balance accurately', () => {
    const summary = service.getCashRegisterForDate();

    expect(summary.registerDate).toBeDefined();
    expect(summary.openingCash).toBe(1500.0); // From seed

    // Cash Sales from seed: Bill 1 had 500 received - 190 change = 310 net cash
    expect(summary.cashSales).toBeGreaterThanOrEqual(310.0);

    // Cash expenses from seed: Tea ₹60
    expect(summary.cashExpenses).toBeGreaterThanOrEqual(60.0);

    // Expected cash: Opening + In - Out
    const calculatedExpected = summary.openingCash + summary.totalCashIn - summary.totalCashOut;
    expect(summary.expectedCash).toBe(calculatedExpected);
  });

  it('sets opening cash for register', () => {
    const today = new Date().toISOString().split('T')[0];
    const summary = service.setOpeningCash(today, 2000.0, 'Updated change drawer amount');

    expect(summary.openingCash).toBe(2000.0);
    expect(summary.status).toBe('OPEN');
  });

  it('closes cash register with currency note denominations, calculates physical total and difference', () => {
    const today = new Date().toISOString().split('T')[0];

    // Say physical drawer has:
    // 3 x ₹500 (1500), 2 x ₹100 (200), 1 x ₹50 (50) = 1750
    const denominations = {
      note500: 3,
      note200: 0,
      note100: 2,
      note50: 1,
      note20: 0,
      note10: 0,
      coins: 0,
    };

    const closed = service.closeCashRegister({
      date: today,
      denominations,
      closingNotes: 'Evening shop close by shopkeeper',
    });

    expect(closed.status).toBe('CLOSED');
    expect(closed.closingCash).toBe(1750.0);
    expect(closed.closedAt).toBeDefined();
    expect(closed.denominations.note500).toBe(3);
    expect(closed.denominations.note100).toBe(2);

    // Difference = 1750 - expectedCash
    expect(closed.difference).toBe(1750.0 - closed.expectedCash);

    // Verify reopen works
    const reopened = service.reopenCashRegister(today);
    expect(reopened.status).toBe('OPEN');
    expect(reopened.closedAt).toBeNull();
  });

  it('retrieves cash register history', () => {
    const history = service.getCashRegisterHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].openingCash).toBeDefined();
  });
});
