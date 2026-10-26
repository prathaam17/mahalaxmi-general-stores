import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { SuppliersService } from '../src/modules/suppliers/suppliers.service.js';

describe('Suppliers and Purchases Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: SuppliersService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new SuppliersService(db);
  });

  it('retrieves suppliers list and calculates supplier metrics', () => {
    const list = service.getSuppliers();
    expect(list.length).toBeGreaterThanOrEqual(2);

    const kamat = list.find((s) => s.name.includes('Kamat Wholesale'));
    expect(kamat).toBeDefined();
    expect(kamat?.currentBalance).toBe(12500.0);
    expect(kamat?.gstin).toBe('29ABCDE1234F1Z5');

    const metrics = service.getSupplierMetrics();
    expect(metrics.totalSuppliers).toBeGreaterThanOrEqual(2);
    expect(metrics.totalPayableBalance).toBeGreaterThanOrEqual(15700.0);
    expect(metrics.suppliersWithDueCount).toBeGreaterThanOrEqual(2);
  });

  it('creates new supplier with optional initial balance and records in ledger', () => {
    const created = service.createSupplier({
      name: 'Bhat Spice Traders',
      phone: '+91 98451 11223',
      gstin: '29AAACB1111A1Z1',
      address: 'Main Bazaar, Sirsi',
      initialBalance: 4500.0,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Bhat Spice Traders');
    expect(created.currentBalance).toBe(4500.0);

    const ledger = db.prepare('SELECT * FROM supplier_ledger WHERE supplier_id = ?').all(created.id) as Array<{
      entry_type: string;
      amount: number;
      notes: string;
    }>;
    expect(ledger.length).toBe(1);
    expect(ledger[0].entry_type).toBe('CREDIT');
    expect(ledger[0].amount).toBe(4500.0);
    expect(ledger[0].notes).toContain('Opening payable balance');
  });

  it('records inward purchase, increments stock, updates cost price, and manages supplier ledger', () => {
    // Check initial stock and cost price of Sona Masoori Rice (Loose) (ID 1)
    const initialProduct = db.prepare('SELECT current_stock, cost_price FROM products WHERE id = 1').get() as {
      current_stock: number;
      cost_price: number;
    };
    const initialStock = initialProduct.current_stock;
    const initialCost = initialProduct.cost_price;

    const supplier = service.getSuppliers()[0];
    const initialSupplierBalance = supplier.currentBalance;

    // Record purchase of 50kg rice at new rate of ₹50/kg (total ₹2500), paying ₹1000 cash and ₹1500 on credit
    const purchase = service.recordPurchase({
      supplierId: supplier.id,
      invoiceNumber: 'INV-TEST-999',
      purchaseDate: '2026-10-26',
      items: [
        {
          productId: 1,
          productName: 'Sona Masoori Rice (Loose)',
          quantity: 50,
          unit: 'kg',
          unitCostPrice: 50.0,
          updateProductCost: true,
        },
      ],
      paymentMode: 'CASH',
      paidAmount: 1000.0,
      notes: 'New rice harvest stock delivery',
    });

    expect(purchase.id).toBeDefined();
    expect(purchase.invoiceNumber).toBe('INV-TEST-999');
    expect(purchase.grandTotal).toBe(2500.0);
    expect(purchase.paidAmount).toBe(1000.0);
    expect(purchase.paymentStatus).toBe('PARTIAL');

    // 1. Verify stock incremented by 50kg and cost price updated
    const updatedProduct = db.prepare('SELECT current_stock, cost_price FROM products WHERE id = 1').get() as {
      current_stock: number;
      cost_price: number;
    };
    expect(updatedProduct.current_stock).toBe(initialStock + 50);
    expect(updatedProduct.cost_price).toBe(50.0);

    // 2. Verify supplier balance increased by net unpaid credit (2500 - 1000 = +1500)
    const updatedSupplier = service.getSupplierById(supplier.id);
    expect(updatedSupplier?.currentBalance).toBe(initialSupplierBalance + 1500.0);

    // 3. Verify ledger entries (CREDIT 2500 for goods, DEBIT 1000 for cash paid)
    const ledger = db
      .prepare('SELECT * FROM supplier_ledger WHERE purchase_id = ? ORDER BY id ASC')
      .all(purchase.id) as Array<{
      entry_type: string;
      amount: number;
      notes: string;
    }>;
    expect(ledger.length).toBe(2);
    expect(ledger[0].entry_type).toBe('CREDIT');
    expect(ledger[0].amount).toBe(2500.0);
    expect(ledger[1].entry_type).toBe('DEBIT');
    expect(ledger[1].amount).toBe(1000.0);

    // 4. Verify audit log
    const auditLogs = db.prepare("SELECT * FROM audit_logs WHERE action = 'STOCK_INWARD'").all();
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it('records payment to supplier, reduces payable balance, and creates ledger entry', () => {
    const kamat = service.getSuppliers().find((s) => s.name.includes('Kamat Wholesale'))!;
    const initialBal = kamat.currentBalance; // 12500

    const paymentResult = service.recordPayment(kamat.id, {
      amount: 5000.0,
      paymentMode: 'BANK_TRANSFER',
      notes: 'NEFT transfer ref #UTR998877',
    });

    expect(paymentResult.supplier.currentBalance).toBe(initialBal - 5000.0);
    expect(paymentResult.ledgerEntry.entryType).toBe('DEBIT');
    expect(paymentResult.ledgerEntry.amount).toBe(5000.0);
    expect(paymentResult.ledgerEntry.balanceAfter).toBe(initialBal - 5000.0);
    expect(paymentResult.ledgerEntry.paymentMode).toBe('BANK_TRANSFER');

    // Verify audit log
    const audit = db
      .prepare("SELECT * FROM audit_logs WHERE action = 'SUPPLIER_PAYMENT' ORDER BY id DESC LIMIT 1")
      .get() as { details: string };
    expect(audit.details).toContain('₹5000.00');
    expect(audit.details).toContain('BANK_TRANSFER');
  });

  it('generates supplier statement with chronological ledger and running balance', () => {
    const kamat = service.getSuppliers().find((s) => s.name.includes('Kamat Wholesale'))!;
    const statement = service.getSupplierStatement(kamat.id);

    expect(statement.supplier.id).toBe(kamat.id);
    expect(statement.summary.currentBalance).toBe(kamat.currentBalance);
    expect(statement.entries.length).toBeGreaterThan(0);

    // Check chronological order and entries
    const firstEntry = statement.entries[0];
    expect(firstEntry.entryType).toBe('CREDIT');
    expect(firstEntry.amount).toBe(12500.0);
  });

  it('prevents deactivating a supplier with outstanding balance', () => {
    const kamat = service.getSuppliers().find((s) => s.name.includes('Kamat Wholesale'))!;
    expect(kamat.currentBalance).toBeGreaterThan(0);

    expect(() => {
      service.deleteSupplier(kamat.id);
    }).toThrow('Cannot deactivate supplier');
  });
});
