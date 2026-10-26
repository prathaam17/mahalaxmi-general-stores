import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from '../../db/index.js';

export interface SupplierFilter {
  search?: string;
  hasBalance?: boolean;
}

export interface CreateSupplierInput {
  name: string;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  initialBalance?: number;
}

export interface UpdateSupplierInput {
  name: string;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
}

export interface SupplierWithMeta {
  id: number;
  name: string;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  currentBalance: number;
  totalPurchasesCount: number;
  lastPurchaseDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierMetrics {
  totalSuppliers: number;
  totalPayableBalance: number;
  suppliersWithDueCount: number;
  purchasesThisMonth: number;
  paymentsMadeThisMonth: number;
}

export interface PurchaseItemInput {
  productId?: number | null;
  productName: string;
  quantity: number;
  unit: string;
  unitCostPrice: number;
  updateProductCost?: boolean;
}

export interface RecordPurchaseInput {
  supplierId: number;
  invoiceNumber?: string;
  purchaseDate?: string;
  items: PurchaseItemInput[];
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';
  paidAmount: number;
  notes?: string;
}

export interface SupplierLedgerEntry {
  id: number;
  supplierId: number;
  purchaseId: number | null;
  invoiceNumber: string | null;
  entryType: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  paymentMode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SupplierStatement {
  supplier: SupplierWithMeta;
  summary: {
    totalDeliveries: number;
    totalPayments: number;
    currentBalance: number;
    totalTransactions: number;
  };
  entries: SupplierLedgerEntry[];
}

export interface PurchaseWithItems {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  supplierPhone: string | null;
  totalItems: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentMode: string;
  paymentStatus: string;
  notes: string | null;
  purchaseDate: string;
  createdAt: string;
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    unitCostPrice: number;
    lineTotal: number;
  }>;
}

export class SuppliersService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  getSuppliers(filters: SupplierFilter = {}): SupplierWithMeta[] {
    const conditions: string[] = ['s.is_active = 1'];
    const params: Array<string | number | null | bigint | Uint8Array> = [];

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.phone LIKE ? OR s.gstin LIKE ?)');
      params.push(q, q, q);
    }

    if (filters.hasBalance) {
      conditions.push('s.current_balance > 0');
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        s.id,
        s.name,
        s.phone,
        s.gstin,
        s.address,
        s.current_balance as currentBalance,
        s.is_active as isActive,
        s.created_at as createdAt,
        COUNT(DISTINCT p.id) as totalPurchasesCount,
        MAX(p.purchase_date) as lastPurchaseDate
      FROM suppliers s
      LEFT JOIN purchases p ON p.supplier_id = s.id
      WHERE ${whereClause}
      GROUP BY s.id
      ORDER BY s.current_balance DESC, s.name ASC
    `;

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      name: string;
      phone: string | null;
      gstin: string | null;
      address: string | null;
      currentBalance: number;
      isActive: number;
      createdAt: string;
      totalPurchasesCount: number;
      lastPurchaseDate: string | null;
    }>;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      gstin: r.gstin,
      address: r.address,
      currentBalance: Number(r.currentBalance),
      totalPurchasesCount: Number(r.totalPurchasesCount),
      lastPurchaseDate: r.lastPurchaseDate,
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt,
    }));
  }

  getSupplierById(id: number): SupplierWithMeta | null {
    const sql = `
      SELECT
        s.id,
        s.name,
        s.phone,
        s.gstin,
        s.address,
        s.current_balance as currentBalance,
        s.is_active as isActive,
        s.created_at as createdAt,
        COUNT(DISTINCT p.id) as totalPurchasesCount,
        MAX(p.purchase_date) as lastPurchaseDate
      FROM suppliers s
      LEFT JOIN purchases p ON p.supplier_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `;

    const row = this.db.prepare(sql).get(id) as {
      id: number;
      name: string;
      phone: string | null;
      gstin: string | null;
      address: string | null;
      currentBalance: number;
      isActive: number;
      createdAt: string;
      totalPurchasesCount: number;
      lastPurchaseDate: string | null;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      gstin: row.gstin,
      address: row.address,
      currentBalance: Number(row.currentBalance),
      totalPurchasesCount: Number(row.totalPurchasesCount),
      lastPurchaseDate: row.lastPurchaseDate,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
    };
  }

  getSupplierMetrics(): SupplierMetrics {
    const summary = this.db.prepare(`
      SELECT
        COUNT(id) as totalSuppliers,
        COALESCE(SUM(current_balance), 0) as totalPayableBalance,
        COALESCE(SUM(CASE WHEN current_balance > 0 THEN 1 ELSE 0 END), 0) as suppliersWithDueCount
      FROM suppliers
      WHERE is_active = 1
    `).get() as {
      totalSuppliers: number;
      totalPayableBalance: number;
      suppliersWithDueCount: number;
    };

    const purchasesMonth = this.db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as totalPurchasesMonth
      FROM purchases
      WHERE purchase_date >= DATE('now', 'start of month', 'localtime')
    `).get() as { totalPurchasesMonth: number };

    const paymentsMonth = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalPaymentsMonth
      FROM supplier_ledger
      WHERE entry_type = 'DEBIT'
        AND DATE(created_at, 'localtime') >= DATE('now', 'start of month', 'localtime')
    `).get() as { totalPaymentsMonth: number };

    return {
      totalSuppliers: Number(summary.totalSuppliers),
      totalPayableBalance: Number(summary.totalPayableBalance),
      suppliersWithDueCount: Number(summary.suppliersWithDueCount),
      purchasesThisMonth: Number(purchasesMonth.totalPurchasesMonth),
      paymentsMadeThisMonth: Number(paymentsMonth.totalPaymentsMonth),
    };
  }

  createSupplier(input: CreateSupplierInput): SupplierWithMeta {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Supplier / Distributor name is required');
    }

    const initialBalance = Number(input.initialBalance) || 0;

    return runInTransaction(this.db, () => {
      const insertResult = this.db.prepare(`
        INSERT INTO suppliers (name, phone, gstin, address, current_balance, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(
        trimmedName,
        input.phone?.trim() || null,
        input.gstin?.trim() ? input.gstin.trim().toUpperCase() : null,
        input.address?.trim() || null,
        initialBalance
      );

      const supplierId = Number(insertResult.lastInsertRowid);

      if (initialBalance > 0) {
        this.db.prepare(`
          INSERT INTO supplier_ledger (supplier_id, entry_type, amount, balance_after, payment_mode, notes)
          VALUES (?, 'CREDIT', ?, ?, 'OPENING', 'Opening payable balance')
        `).run(supplierId, initialBalance, initialBalance);
      }

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('CREATE_SUPPLIER', 'SUPPLIER', ?, ?)
      `).run(
        String(supplierId),
        `Created supplier "${trimmedName}" with initial balance ₹${initialBalance.toFixed(2)}`
      );

      const created = this.getSupplierById(supplierId);
      if (!created) {
        throw new Error('Failed to retrieve newly created supplier');
      }
      return created;
    });
  }

  updateSupplier(id: number, input: UpdateSupplierInput): SupplierWithMeta {
    const existing = this.getSupplierById(id);
    if (!existing) {
      throw new Error(`Supplier #${id} not found`);
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Supplier name cannot be empty');
    }

    return runInTransaction(this.db, () => {
      this.db.prepare(`
        UPDATE suppliers
        SET name = ?, phone = ?, gstin = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        trimmedName,
        input.phone?.trim() || null,
        input.gstin?.trim() ? input.gstin.trim().toUpperCase() : null,
        input.address?.trim() || null,
        id
      );

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('UPDATE_SUPPLIER', 'SUPPLIER', ?, ?)
      `).run(String(id), `Updated supplier info for "${trimmedName}"`);

      return this.getSupplierById(id)!;
    });
  }

  deleteSupplier(id: number): void {
    const existing = this.getSupplierById(id);
    if (!existing) {
      throw new Error(`Supplier #${id} not found`);
    }

    if (existing.currentBalance > 0) {
      throw new Error(
        `Cannot deactivate supplier "${existing.name}" with outstanding payable balance of ₹${existing.currentBalance.toFixed(2)}. Settle the account first.`
      );
    }

    runInTransaction(this.db, () => {
      this.db.prepare(`UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('DEACTIVATE_SUPPLIER', 'SUPPLIER', ?, ?)
      `).run(String(id), `Deactivated supplier "${existing.name}"`);
    });
  }

  recordPurchase(input: RecordPurchaseInput): PurchaseWithItems {
    const supplier = this.getSupplierById(input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier #${input.supplierId} not found`);
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('Purchase must contain at least one item');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const purchaseDate = input.purchaseDate || todayStr;

    return runInTransaction(this.db, () => {
      // 1. Determine invoice number
      let invoiceNumber = input.invoiceNumber?.trim();
      if (!invoiceNumber) {
        const dateCompact = purchaseDate.replace(/-/g, '');
        const countRow = this.db.prepare(`
          SELECT COUNT(id) as count FROM purchases WHERE purchase_date = ?
        `).get(purchaseDate) as { count: number };
        const seq = (countRow.count + 1).toString().padStart(4, '0');
        invoiceNumber = `PUR-${dateCompact}-${seq}`;
      }

      // Check unique invoice
      const existingInv = this.db.prepare('SELECT id FROM purchases WHERE invoice_number = ?').get(invoiceNumber);
      if (existingInv) {
        throw new Error(`Invoice number "${invoiceNumber}" has already been recorded`);
      }

      // Calculate totals
      let subtotal = 0;
      const validatedItems = input.items.map((item) => {
        if (!item.productName?.trim()) {
          throw new Error('Item name is required');
        }
        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity (${item.quantity}) for item "${item.productName}"`);
        }
        if (item.unitCostPrice < 0) {
          throw new Error(`Invalid cost price (${item.unitCostPrice}) for item "${item.productName}"`);
        }
        const lineTotal = Math.round(item.quantity * item.unitCostPrice * 100) / 100;
        subtotal += lineTotal;
        return {
          ...item,
          lineTotal,
        };
      });

      const grandTotal = Math.round(subtotal * 100) / 100;
      const paidAmount = Math.max(0, Math.min(grandTotal, Number(input.paidAmount) || 0));

      let paymentStatus = 'PAID';
      if (paidAmount === 0) {
        paymentStatus = 'UNPAID';
      } else if (paidAmount < grandTotal) {
        paymentStatus = 'PARTIAL';
      }

      // 2. Insert into purchases table
      const purchaseResult = this.db.prepare(`
        INSERT INTO purchases (
          invoice_number, supplier_id, total_items, subtotal, tax_amount,
          grand_total, paid_amount, payment_mode, payment_status, notes, purchase_date
        ) VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceNumber,
        input.supplierId,
        validatedItems.length,
        subtotal,
        grandTotal,
        paidAmount,
        input.paymentMode,
        paymentStatus,
        input.notes?.trim() || null,
        purchaseDate
      );

      const purchaseId = Number(purchaseResult.lastInsertRowid);

      // 3. Insert purchase items and update inventory stock & cost price
      const insertItemStmt = this.db.prepare(`
        INSERT INTO purchase_items (
          purchase_id, product_id, product_name, quantity, unit, unit_cost_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = this.db.prepare(`
        UPDATE products
        SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const updateCostStmt = this.db.prepare(`
        UPDATE products
        SET cost_price = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of validatedItems) {
        insertItemStmt.run(
          purchaseId,
          item.productId || null,
          item.productName.trim(),
          item.quantity,
          item.unit,
          item.unitCostPrice,
          item.lineTotal
        );

        if (item.productId) {
          // Inward stock increment
          updateStockStmt.run(item.quantity, item.productId);

          // Update product purchase cost if requested
          if (item.updateProductCost) {
            updateCostStmt.run(item.unitCostPrice, item.productId);
          }

          this.db.prepare(`
            INSERT INTO audit_logs (action, entity_type, entity_id, details)
            VALUES ('STOCK_INWARD', 'PRODUCT', ?, ?)
          `).run(
            String(item.productId),
            `Stock inward +${item.quantity} ${item.unit} via purchase invoice ${invoiceNumber}`
          );
        }
      }

      // 4. Update Supplier Payable Ledger
      // Entry 1: Delivery of goods (increases payable balance by grandTotal)
      const initialSupplierBalance = supplier.currentBalance;
      const balanceAfterDelivery = initialSupplierBalance + grandTotal;

      this.db.prepare(`
        INSERT INTO supplier_ledger (
          supplier_id, purchase_id, entry_type, amount, balance_after, payment_mode, notes
        ) VALUES (?, ?, 'CREDIT', ?, ?, ?, ?)
      `).run(
        input.supplierId,
        purchaseId,
        grandTotal,
        balanceAfterDelivery,
        input.paymentMode,
        `Purchase Invoice #${invoiceNumber}`
      );

      let finalSupplierBalance = balanceAfterDelivery;

      // Entry 2: If amount was paid immediately (reduces payable balance)
      if (paidAmount > 0) {
        finalSupplierBalance = balanceAfterDelivery - paidAmount;
        this.db.prepare(`
          INSERT INTO supplier_ledger (
            supplier_id, purchase_id, entry_type, amount, balance_after, payment_mode, notes
          ) VALUES (?, ?, 'DEBIT', ?, ?, ?, ?)
        `).run(
          input.supplierId,
          purchaseId,
          paidAmount,
          finalSupplierBalance,
          input.paymentMode,
          `Paid on receipt of Invoice #${invoiceNumber}`
        );
      }

      // Update supplier's current balance
      this.db.prepare(`
        UPDATE suppliers
        SET current_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(finalSupplierBalance, input.supplierId);

      // 5. Audit Log
      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('RECORD_PURCHASE', 'PURCHASE', ?, ?)
      `).run(
        invoiceNumber,
        `Recorded purchase invoice ${invoiceNumber} from "${supplier.name}" for ₹${grandTotal.toFixed(2)} (Paid: ₹${paidAmount.toFixed(2)})`
      );

      return this.getPurchaseById(purchaseId)!;
    });
  }

  recordPayment(
    supplierId: number,
    input: { amount: number; paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER'; notes?: string }
  ): { supplier: SupplierWithMeta; ledgerEntry: SupplierLedgerEntry } {
    const supplier = this.getSupplierById(supplierId);
    if (!supplier) {
      throw new Error(`Supplier #${supplierId} not found`);
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    return runInTransaction(this.db, () => {
      const newBalance = Math.round((supplier.currentBalance - amount) * 100) / 100;

      // 1. Update supplier balance
      this.db.prepare(`
        UPDATE suppliers
        SET current_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBalance, supplierId);

      // 2. Insert debit entry into supplier ledger
      const notes = input.notes?.trim() || `Payment via ${input.paymentMode}`;
      const ledgerResult = this.db.prepare(`
        INSERT INTO supplier_ledger (
          supplier_id, entry_type, amount, balance_after, payment_mode, notes
        ) VALUES (?, 'DEBIT', ?, ?, ?, ?)
      `).run(supplierId, amount, newBalance, input.paymentMode, notes);

      const ledgerId = Number(ledgerResult.lastInsertRowid);

      // 3. Audit log
      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('SUPPLIER_PAYMENT', 'SUPPLIER', ?, ?)
      `).run(
        String(supplierId),
        `Recorded payment of ₹${amount.toFixed(2)} to "${supplier.name}" via ${input.paymentMode}`
      );

      const updatedSupplier = this.getSupplierById(supplierId)!;
      const ledgerEntryRow = this.db.prepare(`
        SELECT
          l.id,
          l.supplier_id as supplierId,
          l.purchase_id as purchaseId,
          p.invoice_number as invoiceNumber,
          l.entry_type as entryType,
          l.amount,
          l.balance_after as balanceAfter,
          l.payment_mode as paymentMode,
          l.notes,
          l.created_at as createdAt
        FROM supplier_ledger l
        LEFT JOIN purchases p ON p.id = l.purchase_id
        WHERE l.id = ?
      `).get(ledgerId) as {
        id: number;
        supplierId: number;
        purchaseId: number | null;
        invoiceNumber: string | null;
        entryType: 'CREDIT' | 'DEBIT';
        amount: number;
        balanceAfter: number;
        paymentMode: string | null;
        notes: string | null;
        createdAt: string;
      };

      return {
        supplier: updatedSupplier,
        ledgerEntry: {
          id: ledgerEntryRow.id,
          supplierId: ledgerEntryRow.supplierId,
          purchaseId: ledgerEntryRow.purchaseId,
          invoiceNumber: ledgerEntryRow.invoiceNumber,
          entryType: ledgerEntryRow.entryType,
          amount: Number(ledgerEntryRow.amount),
          balanceAfter: Number(ledgerEntryRow.balanceAfter),
          paymentMode: ledgerEntryRow.paymentMode,
          notes: ledgerEntryRow.notes,
          createdAt: ledgerEntryRow.createdAt,
        },
      };
    });
  }

  getSupplierStatement(supplierId: number): SupplierStatement {
    const supplier = this.getSupplierById(supplierId);
    if (!supplier) {
      throw new Error(`Supplier #${supplierId} not found`);
    }

    const rows = this.db.prepare(`
      SELECT
        l.id,
        l.supplier_id as supplierId,
        l.purchase_id as purchaseId,
        p.invoice_number as invoiceNumber,
        l.entry_type as entryType,
        l.amount,
        l.balance_after as balanceAfter,
        l.payment_mode as paymentMode,
        l.notes,
        l.created_at as createdAt
      FROM supplier_ledger l
      LEFT JOIN purchases p ON p.id = l.purchase_id
      WHERE l.supplier_id = ?
      ORDER BY l.created_at ASC, l.id ASC
    `).all(supplierId) as Array<{
      id: number;
      supplierId: number;
      purchaseId: number | null;
      invoiceNumber: string | null;
      entryType: 'CREDIT' | 'DEBIT';
      amount: number;
      balanceAfter: number;
      paymentMode: string | null;
      notes: string | null;
      createdAt: string;
    }>;

    let totalDeliveries = 0;
    let totalPayments = 0;

    const entries: SupplierLedgerEntry[] = rows.map((r) => {
      const amt = Number(r.amount);
      if (r.entryType === 'CREDIT') {
        totalDeliveries += amt;
      } else {
        totalPayments += amt;
      }

      return {
        id: r.id,
        supplierId: r.supplierId,
        purchaseId: r.purchaseId,
        invoiceNumber: r.invoiceNumber,
        entryType: r.entryType,
        amount: amt,
        balanceAfter: Number(r.balanceAfter),
        paymentMode: r.paymentMode,
        notes: r.notes,
        createdAt: r.createdAt,
      };
    });

    return {
      supplier,
      summary: {
        totalDeliveries: Math.round(totalDeliveries * 100) / 100,
        totalPayments: Math.round(totalPayments * 100) / 100,
        currentBalance: supplier.currentBalance,
        totalTransactions: entries.length,
      },
      entries,
    };
  }

  getPurchases(filters: { supplierId?: number; limit?: number } = {}): PurchaseWithItems[] {
    const conditions: string[] = ['1 = 1'];
    const params: Array<string | number | null | bigint | Uint8Array> = [];

    if (filters.supplierId) {
      conditions.push('p.supplier_id = ?');
      params.push(filters.supplierId);
    }

    const limit = Math.min(filters.limit || 50, 100);

    const sql = `
      SELECT
        p.id,
        p.invoice_number as invoiceNumber,
        p.supplier_id as supplierId,
        s.name as supplierName,
        s.phone as supplierPhone,
        p.total_items as totalItems,
        p.subtotal,
        p.tax_amount as taxAmount,
        p.grand_total as grandTotal,
        p.paid_amount as paidAmount,
        p.payment_mode as paymentMode,
        p.payment_status as paymentStatus,
        p.notes,
        p.purchase_date as purchaseDate,
        p.created_at as createdAt
      FROM purchases p
      JOIN suppliers s ON s.id = p.supplier_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.purchase_date DESC, p.id DESC
      LIMIT ?
    `;
    params.push(limit);

    const purchaseRows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      invoiceNumber: string;
      supplierId: number;
      supplierName: string;
      supplierPhone: string | null;
      totalItems: number;
      subtotal: number;
      taxAmount: number;
      grandTotal: number;
      paidAmount: number;
      paymentMode: string;
      paymentStatus: string;
      notes: string | null;
      purchaseDate: string;
      createdAt: string;
    }>;

    return purchaseRows.map((p) => {
      const items = this.db.prepare(`
        SELECT
          id,
          product_id as productId,
          product_name as productName,
          quantity,
          unit,
          unit_cost_price as unitCostPrice,
          line_total as lineTotal
        FROM purchase_items
        WHERE purchase_id = ?
      `).all(p.id) as Array<{
        id: number;
        productId: number | null;
        productName: string;
        quantity: number;
        unit: string;
        unitCostPrice: number;
        lineTotal: number;
      }>;

      return {
        ...p,
        subtotal: Number(p.subtotal),
        taxAmount: Number(p.taxAmount),
        grandTotal: Number(p.grandTotal),
        paidAmount: Number(p.paidAmount),
        totalItems: Number(p.totalItems),
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: Number(i.quantity),
          unit: i.unit,
          unitCostPrice: Number(i.unitCostPrice),
          lineTotal: Number(i.lineTotal),
        })),
      };
    });
  }

  getPurchaseById(id: number): PurchaseWithItems | null {
    const p = this.db.prepare(`
      SELECT
        p.id,
        p.invoice_number as invoiceNumber,
        p.supplier_id as supplierId,
        s.name as supplierName,
        s.phone as supplierPhone,
        p.total_items as totalItems,
        p.subtotal,
        p.tax_amount as taxAmount,
        p.grand_total as grandTotal,
        p.paid_amount as paidAmount,
        p.payment_mode as paymentMode,
        p.payment_status as paymentStatus,
        p.notes,
        p.purchase_date as purchaseDate,
        p.created_at as createdAt
      FROM purchases p
      JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.id = ?
    `).get(id) as {
      id: number;
      invoiceNumber: string;
      supplierId: number;
      supplierName: string;
      supplierPhone: string | null;
      totalItems: number;
      subtotal: number;
      taxAmount: number;
      grandTotal: number;
      paidAmount: number;
      paymentMode: string;
      paymentStatus: string;
      notes: string | null;
      purchaseDate: string;
      createdAt: string;
    } | undefined;

    if (!p) return null;

    const items = this.db.prepare(`
      SELECT
        id,
        product_id as productId,
        product_name as productName,
        quantity,
        unit,
        unit_cost_price as unitCostPrice,
        line_total as lineTotal
      FROM purchase_items
      WHERE purchase_id = ?
    `).all(p.id) as Array<{
      id: number;
      productId: number | null;
      productName: string;
      quantity: number;
      unit: string;
      unitCostPrice: number;
      lineTotal: number;
    }>;

    return {
      ...p,
      subtotal: Number(p.subtotal),
      taxAmount: Number(p.taxAmount),
      grandTotal: Number(p.grandTotal),
      paidAmount: Number(p.paidAmount),
      totalItems: Number(p.totalItems),
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitCostPrice: Number(i.unitCostPrice),
        lineTotal: Number(i.lineTotal),
      })),
    };
  }
}
