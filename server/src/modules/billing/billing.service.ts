import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from '../../db/index.js';

export interface CartItemInput {
  productId?: number | null;
  productName: string;
  quantity: number;
  unit: string;
  costPrice?: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateBillInput {
  customerId?: number | null;
  items: CartItemInput[];
  discount?: number;
  taxAmount?: number;
  paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'SPLIT';
  cashReceived?: number;
  upiReceived?: number;
  creditAdded?: number;
  notes?: string;
}

export interface BillDetail {
  id: number;
  billNumber: string;
  customerId: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  totalItems: number;
  subtotal: number;
  discount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMode: string;
  cashReceived: number;
  upiReceived: number;
  creditAdded: number;
  changeReturned: number;
  paymentStatus: string;
  notes: string | null;
  isReversed: boolean;
  reversedAt: string | null;
  reversalReason: string | null;
  createdAt: string;
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    costPrice: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export class BillingService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  /**
   * Search active products by barcode, English name, or Kannada name.
   */
  searchProducts(query: string = ''): Array<{
    id: number;
    barcode: string | null;
    name: string;
    kannadaName: string | null;
    categoryId: number | null;
    categoryName: string | null;
    isLoose: boolean;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    mrp: number;
    currentStock: number;
    minStockAlert: number;
  }> {
    const trimmed = query.trim();
    let sql: string;
    let params: Array<string | number | null | bigint | Uint8Array>;

    if (!trimmed) {
      sql = `
        SELECT
          p.id, p.barcode, p.name, p.kannada_name as kannadaName,
          p.category_id as categoryId, c.name as categoryName,
          p.is_loose as isLoose, p.unit, p.cost_price as costPrice,
          p.selling_price as sellingPrice, p.mrp, p.current_stock as currentStock,
          p.min_stock_alert as minStockAlert
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        ORDER BY p.name ASC
        LIMIT 25
      `;
      params = [];
    } else {
      sql = `
        SELECT
          p.id, p.barcode, p.name, p.kannada_name as kannadaName,
          p.category_id as categoryId, c.name as categoryName,
          p.is_loose as isLoose, p.unit, p.cost_price as costPrice,
          p.selling_price as sellingPrice, p.mrp, p.current_stock as currentStock,
          p.min_stock_alert as minStockAlert
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
          AND (
            p.barcode = ?
            OR p.name LIKE ?
            OR p.kannada_name LIKE ?
          )
        ORDER BY
          CASE WHEN p.barcode = ? THEN 0 ELSE 1 END,
          p.name ASC
        LIMIT 25
      `;
      const likeParam = `%${trimmed}%`;
      params = [trimmed, likeParam, likeParam, trimmed];
    }

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      barcode: string | null;
      name: string;
      kannadaName: string | null;
      categoryId: number | null;
      categoryName: string | null;
      isLoose: number;
      unit: string;
      costPrice: number;
      sellingPrice: number;
      mrp: number;
      currentStock: number;
      minStockAlert: number;
    }>;

    return rows.map((r) => ({
      ...r,
      isLoose: Boolean(r.isLoose),
    }));
  }

  /**
   * Search customers for Udhaar billing.
   */
  getCustomers(query: string = ''): Array<{
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
  }> {
    const trimmed = query.trim();
    let sql: string;
    let params: Array<string | number | null | bigint | Uint8Array>;

    if (!trimmed) {
      sql = `
        SELECT id, name, phone, address, credit_limit as creditLimit, current_balance as currentBalance
        FROM customers
        WHERE is_active = 1
        ORDER BY name ASC
      `;
      params = [];
    } else {
      sql = `
        SELECT id, name, phone, address, credit_limit as creditLimit, current_balance as currentBalance
        FROM customers
        WHERE is_active = 1 AND (name LIKE ? OR phone LIKE ?)
        ORDER BY name ASC
      `;
      const likeParam = `%${trimmed}%`;
      params = [likeParam, likeParam];
    }

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      name: string;
      phone: string | null;
      address: string | null;
      creditLimit: number;
      currentBalance: number;
    }>;

    return rows.map((r) => ({
      ...r,
      availableCredit: Math.max(0, r.creditLimit - r.currentBalance),
    }));
  }

  /**
   * Generates a unique, sequential bill number for today:
   * e.g., MGS-20261025-0001
   */
  generateBillNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const prefix = `MGS-${year}${month}${day}-`;

    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM bills WHERE bill_number LIKE ?')
      .get(`${prefix}%`) as { count: number };

    const seq = (row?.count || 0) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * Create a new sale bill atomically:
   * 1. Inserts into bills header
   * 2. Inserts line items into bill_items
   * 3. Decrements inventory stock (supports loose kg decimal quantities)
   * 4. Updates customer credit ledger if Udhaar was used
   * 5. Adds audit log entry
   */
  createBill(input: CreateBillInput): BillDetail {
    if (!input.items || input.items.length === 0) {
      throw new Error('A bill must contain at least one product item.');
    }

    const discount = Math.max(0, Number(input.discount || 0));
    const taxAmount = Math.max(0, Number(input.taxAmount || 0));

    // Calculate subtotal from line items
    const subtotal = input.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const grandTotal = Math.max(0, Math.round((subtotal - discount + taxAmount) * 100) / 100);

    let cashReceived = Math.max(0, Number(input.cashReceived || 0));
    let upiReceived = Math.max(0, Number(input.upiReceived || 0));
    let creditAdded = Math.max(0, Number(input.creditAdded || 0));
    let changeReturned = 0;
    let paymentStatus = 'PAID';

    // Payment validation & calculations
    if (input.paymentMode === 'CASH') {
      if (cashReceived < grandTotal) {
        cashReceived = grandTotal; // exact cash assumed if not specified
      }
      changeReturned = Math.max(0, Math.round((cashReceived - grandTotal) * 100) / 100);
      upiReceived = 0;
      creditAdded = 0;
    } else if (input.paymentMode === 'UPI') {
      upiReceived = grandTotal;
      cashReceived = 0;
      creditAdded = 0;
      changeReturned = 0;
    } else if (input.paymentMode === 'CREDIT') {
      if (!input.customerId) {
        throw new Error('Customer must be selected for Udhaar (Credit) sales.');
      }
      creditAdded = grandTotal;
      cashReceived = 0;
      upiReceived = 0;
      changeReturned = 0;
      paymentStatus = 'CREDIT';
    } else if (input.paymentMode === 'SPLIT') {
      const totalPaid = cashReceived + upiReceived + creditAdded;
      if (totalPaid < grandTotal) {
        throw new Error(`Split payment total (₹${totalPaid}) is less than grand total (₹${grandTotal}).`);
      }
      if (cashReceived > grandTotal - (upiReceived + creditAdded)) {
        changeReturned = Math.round((cashReceived - (grandTotal - (upiReceived + creditAdded))) * 100) / 100;
      }
      if (creditAdded > 0) {
        if (!input.customerId) {
          throw new Error('Customer must be selected when credit is part of split payment.');
        }
        paymentStatus = 'PARTIAL';
      }
    }

    const billNumber = this.generateBillNumber();

    return runInTransaction(this.db, () => {
      // 1. Insert bill header
      const insertBillStmt = this.db.prepare(`
        INSERT INTO bills (
          bill_number, customer_id, total_items, subtotal, discount,
          tax_amount, grand_total, payment_mode, cash_received, upi_received,
          credit_added, change_returned, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertBillStmt.run(
        billNumber,
        input.customerId || null,
        input.items.length,
        subtotal,
        discount,
        taxAmount,
        grandTotal,
        input.paymentMode,
        cashReceived,
        upiReceived,
        creditAdded,
        changeReturned,
        paymentStatus,
        input.notes || null
      );

      // Get the inserted bill id
      const billRow = this.db.prepare('SELECT id, created_at FROM bills WHERE bill_number = ?').get(billNumber) as {
        id: number;
        created_at: string;
      };
      const billId = billRow.id;

      // 2. Insert line items & deduct stock
      const insertItemStmt = this.db.prepare(`
        INSERT INTO bill_items (
          bill_id, product_id, product_name, quantity, unit,
          cost_price, unit_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const deductStockStmt = this.db.prepare(`
        UPDATE products
        SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of input.items) {
        const costPrice = item.costPrice || 0;
        insertItemStmt.run(
          billId,
          item.productId || null,
          item.productName,
          item.quantity,
          item.unit,
          costPrice,
          item.unitPrice,
          item.lineTotal
        );

        if (item.productId) {
          deductStockStmt.run(item.quantity, item.productId);
        }
      }

      // 3. Handle Udhaar Customer Ledger if credit was given
      if (creditAdded > 0 && input.customerId) {
        const custRow = this.db.prepare('SELECT current_balance, name FROM customers WHERE id = ?').get(input.customerId) as {
          current_balance: number;
          name: string;
        } | undefined;

        if (!custRow) {
          throw new Error(`Customer with ID ${input.customerId} not found.`);
        }

        const newBalance = Math.round((custRow.current_balance + creditAdded) * 100) / 100;

        this.db.prepare('UPDATE customers SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
          newBalance,
          input.customerId
        );

        this.db.prepare(`
          INSERT INTO customer_ledger (
            customer_id, bill_id, entry_type, amount, balance_after, payment_mode, notes
          ) VALUES (?, ?, 'DEBIT', ?, ?, ?, ?)
        `).run(
          input.customerId,
          billId,
          creditAdded,
          newBalance,
          input.paymentMode,
          `Udhaar on Bill ${billNumber}`
        );
      }

      // 4. Audit Log
      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES (?, 'BILL', ?, ?)
      `).run(
        'CREATE_BILL',
        billNumber,
        `Created bill ${billNumber} for ₹${grandTotal} (${input.paymentMode}) with ${input.items.length} items`
      );

      return this.getBillById(billId);
    });
  }

  /**
   * Get full bill details by ID.
   */
  getBillById(billId: number): BillDetail {
    const bill = this.db.prepare(`
      SELECT
        b.id,
        b.bill_number as billNumber,
        b.customer_id as customerId,
        c.name as customerName,
        c.phone as customerPhone,
        b.total_items as totalItems,
        b.subtotal,
        b.discount,
        b.tax_amount as taxAmount,
        b.grand_total as grandTotal,
        b.payment_mode as paymentMode,
        b.cash_received as cashReceived,
        b.upi_received as upiReceived,
        b.credit_added as creditAdded,
        b.change_returned as changeReturned,
        b.payment_status as paymentStatus,
        b.notes,
        b.is_reversed as isReversed,
        b.reversed_at as reversedAt,
        b.reversal_reason as reversalReason,
        b.created_at as createdAt
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(billId) as {
      id: number;
      billNumber: string;
      customerId: number | null;
      customerName: string | null;
      customerPhone: string | null;
      totalItems: number;
      subtotal: number;
      discount: number;
      taxAmount: number;
      grandTotal: number;
      paymentMode: string;
      cashReceived: number;
      upiReceived: number;
      creditAdded: number;
      changeReturned: number;
      paymentStatus: string;
      notes: string | null;
      isReversed: number;
      reversedAt: string | null;
      reversalReason: string | null;
      createdAt: string;
    } | undefined;

    if (!bill) {
      throw new Error(`Bill with ID ${billId} does not exist.`);
    }

    const items = this.db.prepare(`
      SELECT
        id,
        product_id as productId,
        product_name as productName,
        quantity,
        unit,
        cost_price as costPrice,
        unit_price as unitPrice,
        line_total as lineTotal
      FROM bill_items
      WHERE bill_id = ?
      ORDER BY id ASC
    `).all(billId) as Array<{
      id: number;
      productId: number | null;
      productName: string;
      quantity: number;
      unit: string;
      costPrice: number;
      unitPrice: number;
      lineTotal: number;
    }>;

    return {
      ...bill,
      isReversed: Boolean(bill.isReversed),
      items,
    };
  }

  /**
   * Controlled reversal of a bill (never silently deleting):
   * Restores stock and customer credit balance atomically.
   */
  reverseBill(billId: number, reason: string): BillDetail {
    if (!reason || reason.trim().length === 0) {
      throw new Error('A reversal reason is required.');
    }

    return runInTransaction(this.db, () => {
      const bill = this.getBillById(billId);

      if (bill.isReversed) {
        throw new Error(`Bill ${bill.billNumber} has already been reversed.`);
      }

      // 1. Restore product stock
      const restoreStockStmt = this.db.prepare(`
        UPDATE products
        SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of bill.items) {
        if (item.productId) {
          restoreStockStmt.run(item.quantity, item.productId);
        }
      }

      // 2. Reverse customer credit if credit was used
      if (bill.creditAdded > 0 && bill.customerId) {
        const custRow = this.db.prepare('SELECT current_balance FROM customers WHERE id = ?').get(bill.customerId) as {
          current_balance: number;
        };

        const newBalance = Math.max(0, Math.round((custRow.current_balance - bill.creditAdded) * 100) / 100);

        this.db.prepare('UPDATE customers SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
          newBalance,
          bill.customerId
        );

        this.db.prepare(`
          INSERT INTO customer_ledger (
            customer_id, bill_id, entry_type, amount, balance_after, payment_mode, notes
          ) VALUES (?, ?, 'CREDIT', ?, ?, 'REVERSAL', ?)
        `).run(
          bill.customerId,
          bill.id,
          bill.creditAdded,
          newBalance,
          `Reversal of Bill ${bill.billNumber}: ${reason}`
        );
      }

      // 3. Mark bill as reversed
      this.db.prepare(`
        UPDATE bills
        SET is_reversed = 1,
            reversed_at = CURRENT_TIMESTAMP,
            reversal_reason = ?
        WHERE id = ?
      `).run(reason.trim(), bill.id);

      // 4. Audit Log
      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('REVERSE_BILL', 'BILL', ?, ?)
      `).run(
        bill.billNumber,
        `Reversed bill ${bill.billNumber} for ₹${bill.grandTotal}. Reason: ${reason}`
      );

      return this.getBillById(billId);
    });
  }
}
