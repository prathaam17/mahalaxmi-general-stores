import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { CustomersService } from '../src/modules/customers/customers.service.js';

describe('Customers and Udhaar Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: CustomersService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new CustomersService(db);
  });

  it('retrieves customers and calculates available credit', () => {
    const list = service.getCustomers();
    expect(list.length).toBeGreaterThan(0);

    const ganesh = list.find((c) => c.name === 'Ganesh Naik');
    expect(ganesh).toBeDefined();
    expect(ganesh?.currentBalance).toBe(680.0);
    expect(ganesh?.creditLimit).toBe(3000.0);
    // Available: 3000 - 680 = 2320
    expect(ganesh?.availableCredit).toBe(2320.0);
  });

  it('creates new customer with optional initial balance and records in ledger', () => {
    const created = service.createCustomer({
      name: 'Ramesh Prabhu',
      phone: '+91 94480 99887',
      address: 'Near Sharada College, Honnavar',
      creditLimit: 4000.0,
      initialBalance: 500.0,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Ramesh Prabhu');
    expect(created.currentBalance).toBe(500.0);
    expect(created.availableCredit).toBe(3500.0);

    // Verify initial ledger entry
    const ledger = db.prepare('SELECT * FROM customer_ledger WHERE customer_id = ?').all(created.id) as Array<{
      entry_type: string;
      amount: number;
    }>;
    expect(ledger.length).toBe(1);
    expect(ledger[0].entry_type).toBe('DEBIT');
    expect(ledger[0].amount).toBe(500.0);
  });

  it('records cash and UPI repayments, decrements balance, and logs in audit', () => {
    const customer = service.getCustomerById(1); // Ganesh Naik (balance ₹680)
    const initialBal = customer.currentBalance;

    // Repay ₹300 via UPI
    const result = service.recordPayment(customer.id, 300.0, 'UPI', 'Google Pay repayment at counter');

    expect(result.customer.currentBalance).toBe(initialBal - 300.0);
    expect(result.entry.entryType).toBe('CREDIT');
    expect(result.entry.amount).toBe(300.0);
    expect(result.entry.balanceAfter).toBe(initialBal - 300.0);
    expect(result.entry.paymentMode).toBe('UPI');

    // Verify audit log
    const audit = db.prepare("SELECT * FROM audit_logs WHERE action = 'CUSTOMER_PAYMENT' ORDER BY id DESC LIMIT 1").get() as {
      details: string;
    };
    expect(audit.details).toContain('repayment of ₹300 (UPI)');
  });

  it('generates customer statement with full transaction ledger history', () => {
    // Record an additional repayment for Ganesh Naik
    service.recordPayment(1, 200.0, 'CASH', 'Part cash repayment');

    const statement = service.getStatement(1);

    expect(statement.customer.id).toBe(1);
    expect(statement.customer.name).toBe('Ganesh Naik');
    expect(statement.entries.length).toBeGreaterThanOrEqual(2);

    // Summary checks
    expect(statement.summary.totalDebits).toBeGreaterThan(0);
    expect(statement.summary.totalCredits).toBeGreaterThanOrEqual(200.0);
    expect(statement.summary.currentBalance).toBe(statement.customer.currentBalance);
  });

  it('calculates customer metrics across the shop', () => {
    const metrics = service.getCustomerMetrics();

    expect(metrics.totalCustomers).toBeGreaterThan(0);
    expect(metrics.totalOutstandingBalance).toBeGreaterThan(0);
    expect(metrics.customersWithDueCount).toBeGreaterThan(0);
  });
});
