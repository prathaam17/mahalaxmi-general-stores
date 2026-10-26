import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from '../../db/index.js';

export interface CustomerFilter {
  search?: string;
  hasBalance?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number;
  initialBalance?: number;
}

export interface UpdateCustomerInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  creditLimit: number;
}

export interface CustomerWithMeta {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  isOverLimit: boolean;
  lastTransactionDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerMetrics {
  totalCustomers: number;
  totalOutstandingBalance: number;
  customersWithDueCount: number;
  repaymentsCollectedToday: number;
}

export interface LedgerEntry {
  id: number;
  customerId: number;
  billId: number | null;
  billNumber: string | null;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  paymentMode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerStatement {
  customer: CustomerWithMeta;
  summary: {
    totalDebits: number;
    totalCredits: number;
    currentBalance: number;
    totalTransactions: number;
  };
  entries: LedgerEntry[];
}

export class CustomersService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  getCustomers(filters: CustomerFilter = {}): CustomerWithMeta[] {
    const conditions: string[] = ['c.is_active = 1'];
    const params: Array<string | number | null | bigint | Uint8Array> = [];

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push('(c.name LIKE ? OR c.phone LIKE ?)');
      params.push(q, q);
    }

    if (filters.hasBalance) {
      conditions.push('c.current_balance > 0');
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        c.id,
        c.name,
        c.phone,
        c.address,
        c.credit_limit as creditLimit,
        c.current_balance as currentBalance,
        c.is_active as isActive,
        c.created_at as createdAt,
        (
          SELECT MAX(cl.created_at)
          FROM customer_ledger cl
          WHERE cl.customer_id = c.id
        ) as lastTransactionDate
      FROM customers c
      WHERE ${whereClause}
      ORDER BY
        c.current_balance DESC,
        c.name ASC
    `;

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      name: string;
      phone: string | null;
      address: string | null;
      creditLimit: number;
      currentBalance: number;
      isActive: number;
      createdAt: string;
      lastTransactionDate: string | null;
    }>;

    return rows.map((r) => {
      const available = Math.max(0, Math.round((r.creditLimit - r.currentBalance) * 100) / 100);
      return {
        ...r,
        isActive: Boolean(r.isActive),
        availableCredit: available,
        isOverLimit: r.currentBalance > r.creditLimit,
      };
    });
  }

  getCustomerMetrics(): CustomerMetrics {
    const row = this.db.prepare(`
      SELECT
        COUNT(id) as totalCustomers,
        COALESCE(SUM(current_balance), 0) as totalOutstanding,
        COUNT(CASE WHEN current_balance > 0 THEN 1 END) as customersWithDue
      FROM customers
      WHERE is_active = 1
    `).get() as {
      totalCustomers: number;
      totalOutstanding: number;
      customersWithDue: number;
    };

    const repaymentsTodayRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as repaymentsToday
      FROM customer_ledger
      WHERE entry_type = 'CREDIT'
        AND DATE(created_at) = DATE('now', 'localtime')
    `).get() as { repaymentsToday: number };

    return {
      totalCustomers: Number(row?.totalCustomers || 0),
      totalOutstandingBalance: Math.round(Number(row?.totalOutstanding || 0) * 100) / 100,
      customersWithDueCount: Number(row?.customersWithDue || 0),
      repaymentsCollectedToday: Math.round(Number(repaymentsTodayRow?.repaymentsToday || 0) * 100) / 100,
    };
  }

  getCustomerById(id: number): CustomerWithMeta {
    const customer = this.db.prepare(`
      SELECT
        c.id,
        c.name,
        c.phone,
        c.address,
        c.credit_limit as creditLimit,
        c.current_balance as currentBalance,
        c.is_active as isActive,
        c.created_at as createdAt,
        (
          SELECT MAX(cl.created_at)
          FROM customer_ledger cl
          WHERE cl.customer_id = c.id
        ) as lastTransactionDate
      FROM customers c
      WHERE c.id = ?
    `).get(id) as {
      id: number;
      name: string;
      phone: string | null;
      address: string | null;
      creditLimit: number;
      currentBalance: number;
      isActive: number;
      createdAt: string;
      lastTransactionDate: string | null;
    } | undefined;

    if (!customer) {
      throw new Error(`Customer with ID ${id} not found.`);
    }

    return {
      ...customer,
      isActive: Boolean(customer.isActive),
      availableCredit: Math.max(0, Math.round((customer.creditLimit - customer.currentBalance) * 100) / 100),
      isOverLimit: customer.currentBalance > customer.creditLimit,
    };
  }

  createCustomer(input: CreateCustomerInput): CustomerWithMeta {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Customer name is required.');
    }

    const creditLimit = Number(input.creditLimit ?? 2000);
    const initialBalance = Math.max(0, Number(input.initialBalance || 0));

    return runInTransaction(this.db, () => {
      const stmt = this.db.prepare(`
        INSERT INTO customers (name, phone, address, credit_limit, current_balance)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        name,
        input.phone?.trim() || null,
        input.address?.trim() || null,
        creditLimit,
        initialBalance
      );

      const inserted = this.db.prepare('SELECT id FROM customers WHERE name = ? ORDER BY id DESC LIMIT 1').get(name) as { id: number };

      if (initialBalance > 0) {
        this.db.prepare(`
          INSERT INTO customer_ledger (customer_id, entry_type, amount, balance_after, payment_mode, notes)
          VALUES (?, 'DEBIT', ?, ?, 'INITIAL', 'Opening balance record')
        `).run(inserted.id, initialBalance, initialBalance);
      }

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('CREATE_CUSTOMER', 'CUSTOMER', ?, ?)
      `).run(String(inserted.id), `Registered customer "${name}" (Credit Limit: ₹${creditLimit}, Initial Udhaar: ₹${initialBalance})`);

      return this.getCustomerById(inserted.id);
    });
  }

  updateCustomer(id: number, input: UpdateCustomerInput): CustomerWithMeta {
    const existing = this.getCustomerById(id);
    const name = input.name.trim();
    if (!name) {
      throw new Error('Customer name is required.');
    }

    return runInTransaction(this.db, () => {
      this.db.prepare(`
        UPDATE customers
        SET name = ?,
            phone = ?,
            address = ?,
            credit_limit = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name,
        input.phone?.trim() || null,
        input.address?.trim() || null,
        Number(input.creditLimit || 2000),
        id
      );

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('UPDATE_CUSTOMER', 'CUSTOMER', ?, ?)
      `).run(String(id), `Updated customer "${existing.name}" details.`);

      return this.getCustomerById(id);
    });
  }

  recordPayment(
    customerId: number,
    amount: number,
    paymentMode: 'CASH' | 'UPI',
    notes?: string
  ): { customer: CustomerWithMeta; entry: LedgerEntry } {
    if (amount <= 0) {
      throw new Error('Repayment amount must be greater than zero.');
    }

    return runInTransaction(this.db, () => {
      const customer = this.getCustomerById(customerId);

      const currentBal = customer.currentBalance;
      const newBal = Math.round((currentBal - amount) * 100) / 100;

      // Update customer balance
      this.db.prepare(`
        UPDATE customers
        SET current_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBal, customerId);

      // Insert into customer ledger
      const insertLedger = this.db.prepare(`
        INSERT INTO customer_ledger (
          customer_id, bill_id, entry_type, amount, balance_after, payment_mode, notes
        ) VALUES (?, NULL, 'CREDIT', ?, ?, ?, ?)
      `);

      const noteText = notes?.trim() || `Udhaar Repayment received (${paymentMode})`;
      insertLedger.run(customerId, amount, newBal, paymentMode, noteText);

      const entryRow = this.db.prepare('SELECT id, created_at FROM customer_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT 1').get(customerId) as {
        id: number;
        created_at: string;
      };

      // Audit log
      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('CUSTOMER_PAYMENT', 'CUSTOMER', ?, ?)
      `).run(
        String(customerId),
        `Received repayment of ₹${amount} (${paymentMode}) from ${customer.name}. New balance: ₹${newBal}`
      );

      const updatedCustomer = this.getCustomerById(customerId);
      const entry: LedgerEntry = {
        id: entryRow.id,
        customerId,
        billId: null,
        billNumber: null,
        entryType: 'CREDIT',
        amount,
        balanceAfter: newBal,
        paymentMode,
        notes: noteText,
        createdAt: entryRow.created_at,
      };

      return { customer: updatedCustomer, entry };
    });
  }

  getStatement(customerId: number, startDate?: string, endDate?: string): CustomerStatement {
    const customer = this.getCustomerById(customerId);

    const conditions: string[] = ['cl.customer_id = ?'];
    const params: Array<string | number | null | bigint | Uint8Array> = [customerId];

    if (startDate) {
      conditions.push("DATE(cl.created_at) >= DATE(?)");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("DATE(cl.created_at) <= DATE(?)");
      params.push(endDate);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        cl.id,
        cl.customer_id as customerId,
        cl.bill_id as billId,
        b.bill_number as billNumber,
        cl.entry_type as entryType,
        cl.amount,
        cl.balance_after as balanceAfter,
        cl.payment_mode as paymentMode,
        cl.notes,
        cl.created_at as createdAt
      FROM customer_ledger cl
      LEFT JOIN bills b ON cl.bill_id = b.id
      WHERE ${whereClause}
      ORDER BY cl.id ASC
    `;

    const entries = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      customerId: number;
      billId: number | null;
      billNumber: string | null;
      entryType: 'DEBIT' | 'CREDIT';
      amount: number;
      balanceAfter: number;
      paymentMode: string | null;
      notes: string | null;
      createdAt: string;
    }>;

    let totalDebits = 0;
    let totalCredits = 0;

    for (const e of entries) {
      if (e.entryType === 'DEBIT') {
        totalDebits += e.amount;
      } else if (e.entryType === 'CREDIT') {
        totalCredits += e.amount;
      }
    }

    return {
      customer,
      summary: {
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        currentBalance: customer.currentBalance,
        totalTransactions: entries.length,
      },
      entries,
    };
  }

  deactivateCustomer(id: number): boolean {
    return runInTransaction(this.db, () => {
      const customer = this.getCustomerById(id);

      this.db.prepare(`
        UPDATE customers
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('DEACTIVATE_CUSTOMER', 'CUSTOMER', ?, ?)
      `).run(String(id), `Deactivated customer account "${customer.name}". Ledger records preserved.`);

      return true;
    });
  }
}
