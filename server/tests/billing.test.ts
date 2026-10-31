import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { BillingService } from '../src/modules/billing/billing.service.js';

describe('Billing Module Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: BillingService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new BillingService(db);
  });

  it('searches products by barcode, English name, and Kannada name', () => {
    // Exact barcode search
    const milk = service.searchProducts('8901030383112');
    expect(milk.length).toBeGreaterThan(0);
    expect(milk[0].name).toContain('Nandini Toned Milk');
    expect(milk[0].isLoose).toBe(false);

    // Name search
    const rice = service.searchProducts('Sona Masoori');
    expect(rice.length).toBeGreaterThan(0);
    expect(rice[0].name).toContain('Rice');
    expect(rice[0].isLoose).toBe(true);

    // Kannada name search
    const sugar = service.searchProducts('ಸಕ್ಕರೆ');
    expect(sugar.length).toBeGreaterThan(0);
    expect(sugar[0].name).toContain('Sugar');
  });

  it('searches products phonetically using Kanglish (Kannada typed in English alphabet)', () => {
    // 1. "sakkare" should find Sugar
    const sugarMatches = service.searchProducts('sakkare');
    expect(sugarMatches.length).toBeGreaterThan(0);
    expect(sugarMatches[0].name).toContain('Sugar');

    // 2. "akki" should find Rice
    const riceMatches = service.searchProducts('akki');
    expect(riceMatches.length).toBeGreaterThan(0);
    expect(riceMatches[0].name).toContain('Rice');

    // 3. "haalu" should find Milk
    const milkMatches = service.searchProducts('haalu');
    expect(milkMatches.length).toBeGreaterThan(0);
    expect(milkMatches[0].name).toContain('Milk');

    // 4. "tuppa" should find Ghee
    const gheeMatches = service.searchProducts('tuppa');
    expect(gheeMatches.length).toBeGreaterThan(0);
    expect(gheeMatches[0].name).toContain('Ghee');

    // 5. "bella" should find Jaggery
    const jaggeryMatches = service.searchProducts('bella');
    expect(jaggeryMatches.length).toBeGreaterThan(0);
    expect(jaggeryMatches[0].name).toContain('Jaggery');

    // 6. "uppu" should find Salt
    const saltMatches = service.searchProducts('uppu');
    expect(saltMatches.length).toBeGreaterThan(0);
    expect(saltMatches[0].name).toContain('Salt');
  });

  it('creates a Cash bill and deducts inventory stock accurately', () => {
    // Initial stock of Sona Masoori Rice (Loose) is 245.5 kg in seed data
    const prodBefore = db.prepare('SELECT current_stock FROM products WHERE barcode = ?').get('LOOSE-001') as {
      current_stock: number;
    };
    const initialStock = prodBefore.current_stock;

    const bill = service.createBill({
      paymentMode: 'CASH',
      slipNumber: 'Book-1-Slip-20',
      cashReceived: 500,
      items: [
        {
          productId: 1, // Sona Masoori Rice
          productName: 'Sona Masoori Rice (Loose)',
          quantity: 2.5,
          unit: 'kg',
          unitPrice: 56.0,
          costPrice: 48.0,
          lineTotal: 140.0,
        },
      ],
      discount: 0,
      taxAmount: 0,
    });

    expect(bill.id).toBeDefined();
    expect(bill.billNumber).toMatch(/^MGS-\d{8}-\d{4}$/);
    expect(bill.slipNumber).toBe('Book-1-Slip-20');
    expect(bill.grandTotal).toBe(140.0);
    expect(bill.cashReceived).toBe(500.0);
    expect(bill.changeReturned).toBe(360.0); // 500 - 140
    expect(bill.paymentStatus).toBe('PAID');

    // Stock should be decremented by exactly 2.5 kg
    const prodAfter = db.prepare('SELECT current_stock FROM products WHERE barcode = ?').get('LOOSE-001') as {
      current_stock: number;
    };
    expect(prodAfter.current_stock).toBe(initialStock - 2.5);
  });

  it('creates an Udhaar (Credit) bill, updates customer balance, and records in ledger', () => {
    const custBefore = db.prepare('SELECT current_balance FROM customers WHERE id = 1').get() as {
      current_balance: number;
    };

    const bill = service.createBill({
      customerId: 1, // Ganesh Naik
      paymentMode: 'CREDIT',
      items: [
        {
          productId: 2, // Sugar
          productName: 'Sugar (Loose)',
          quantity: 1.0,
          unit: 'kg',
          unitPrice: 44.0,
          costPrice: 38.0,
          lineTotal: 44.0,
        },
      ],
    });

    expect(bill.paymentMode).toBe('CREDIT');
    expect(bill.creditAdded).toBe(44.0);

    // Verify customer balance increased
    const custAfter = db.prepare('SELECT current_balance FROM customers WHERE id = 1').get() as {
      current_balance: number;
    };
    expect(custAfter.current_balance).toBe(custBefore.current_balance + 44.0);

    // Verify ledger entry
    const ledger = db.prepare('SELECT * FROM customer_ledger WHERE bill_id = ?').get(bill.id) as {
      entry_type: string;
      amount: number;
      balance_after: number;
    };
    expect(ledger).toBeDefined();
    expect(ledger.entry_type).toBe('DEBIT');
    expect(ledger.amount).toBe(44.0);
    expect(ledger.balance_after).toBe(custAfter.current_balance);
  });

  it('reverses a bill, restoring stock and rolling back customer credit', () => {
    // 1. Create a credit bill
    const bill = service.createBill({
      customerId: 1,
      paymentMode: 'CREDIT',
      items: [
        {
          productId: 1,
          productName: 'Sona Masoori Rice (Loose)',
          quantity: 5.0,
          unit: 'kg',
          unitPrice: 56.0,
          lineTotal: 280.0,
        },
      ],
    });

    const stockBeforeReversal = (
      db.prepare('SELECT current_stock FROM products WHERE id = 1').get() as { current_stock: number }
    ).current_stock;
    const balanceBeforeReversal = (
      db.prepare('SELECT current_balance FROM customers WHERE id = 1').get() as { current_balance: number }
    ).current_balance;

    // 2. Perform controlled reversal
    const reversedBill = service.reverseBill(bill.id, 'Customer returned goods');

    expect(reversedBill.isReversed).toBe(true);
    expect(reversedBill.reversalReason).toBe('Customer returned goods');

    // Stock should be restored by 5.0 kg
    const stockAfterReversal = (
      db.prepare('SELECT current_stock FROM products WHERE id = 1').get() as { current_stock: number }
    ).current_stock;
    expect(stockAfterReversal).toBe(stockBeforeReversal + 5.0);

    // Customer credit should be reduced by 280.0
    const balanceAfterReversal = (
      db.prepare('SELECT current_balance FROM customers WHERE id = 1').get() as { current_balance: number }
    ).current_balance;
    expect(balanceAfterReversal).toBe(balanceBeforeReversal - 280.0);

    // Double reversal should throw error
    expect(() => {
      service.reverseBill(bill.id, 'Try again');
    }).toThrow(/already been reversed/);
  });
});
