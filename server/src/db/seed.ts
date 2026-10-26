import { getDatabase, runInTransaction } from './index.js';
import { runMigrations } from './migrate.js';

export function seedDemoData(database = getDatabase()): void {
  // Ensure schema is up to date
  runMigrations(database);

  console.log('[Seed] Seeding realistic sample demo data for Mahalaxmi General Stores...');

  runInTransaction(database, () => {
    // Clear existing demo data and reset autoincrement sequences
    database.exec(`
      DELETE FROM audit_logs;
      DELETE FROM customer_ledger;
      DELETE FROM bill_items;
      DELETE FROM bills;
      DELETE FROM supplier_ledger;
      DELETE FROM purchase_items;
      DELETE FROM purchases;
      DELETE FROM expenses;
      DELETE FROM products;
      DELETE FROM categories;
      DELETE FROM customers;
      DELETE FROM suppliers;
      DELETE FROM sqlite_sequence;
    `);

    // 1. Categories
    const insertCat = database.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    insertCat.run('Grains & Pulses', 'Rice, Dal, Atta, Grains and Millets');
    insertCat.run('Oils & Ghee', 'Cooking oils, Nandini ghee, Mustard oil');
    insertCat.run('Dairy & Fresh', 'Milk, Curd, Paneer, Butter');
    insertCat.run('Spices & Masala', 'Chilli powder, Turmeric, Whole spices');
    insertCat.run('Soaps & Detergents', 'Bathing soap, Washing powder, Cleaners');
    insertCat.run('Snacks & Beverages', 'Biscuits, Tea powder, Coffee, Snacks');

    const catRows = database.prepare('SELECT id, name FROM categories').all() as Array<{ id: number; name: string }>;
    const cats: Record<string, number> = Object.fromEntries(catRows.map((c) => [c.name, c.id]));

    // 2. Products (Loose goods & Packaged goods)
    const insertProd = database.prepare(`
      INSERT INTO products (
        barcode, name, kannada_name, category_id, is_loose, unit,
        cost_price, selling_price, mrp, current_stock, min_stock_alert
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Loose goods (sold by weight/kg)
    insertProd.run('LOOSE-001', 'Sona Masoori Rice (Loose)', 'ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ', cats['Grains & Pulses'], 1, 'kg', 48.00, 56.00, 60.00, 245.50, 50.00);
    insertProd.run('LOOSE-002', 'Sugar (Loose)', 'ಸಕ್ಕರೆ', cats['Grains & Pulses'], 1, 'kg', 38.00, 44.00, 46.00, 180.00, 40.00);
    insertProd.run('LOOSE-003', 'Toor Dal Premium (Loose)', 'ತೊಗರಿ ಬೇಳೆ', cats['Grains & Pulses'], 1, 'kg', 142.00, 160.00, 170.00, 45.20, 25.00);
    insertProd.run('LOOSE-004', 'Jaggery / Bellada Achhu', 'ಬೆಲ್ಲದ ಅಚ್ಚು', cats['Grains & Pulses'], 1, 'kg', 52.00, 62.00, 65.00, 14.00, 20.00); // Low stock alert!
    insertProd.run('LOOSE-005', 'Groundnut Seeds (Loose)', 'ಕಡಲೆಕಾಯಿ ಬೀಜ', cats['Grains & Pulses'], 1, 'kg', 115.00, 130.00, 140.00, 32.00, 15.00);

    // Packaged goods
    insertProd.run('8901030383112', 'Nandini Toned Milk 500ml', 'ನಂದಿನಿ ನೀಲಿ ಹಾಲು', cats['Dairy & Fresh'], 0, 'packet', 23.50, 25.00, 25.00, 18.00, 10.00);
    insertProd.run('8901030383999', 'Nandini Pure Ghee 200ml', 'ನಂದಿನಿ ಶುದ್ಧ ತುಪ್ಪ', cats['Oils & Ghee'], 0, 'packet', 128.00, 140.00, 140.00, 8.00, 10.00); // Low stock alert!
    insertProd.run('8901030001000', 'Tata Salt 1kg', 'ಟಾಟಾ ಉಪ್ಪು', cats['Spices & Masala'], 0, 'packet', 24.00, 28.00, 28.00, 65.00, 15.00);
    insertProd.run('8901030002001', 'Gemini Sunflower Oil 1L Pouch', 'ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ', cats['Oils & Ghee'], 0, 'packet', 122.00, 136.00, 145.00, 34.00, 12.00);
    insertProd.run('8901719101010', 'Parle-G Gold Biscuit 250g', 'ಪಾರ್ಲೆ-ಜಿ ಬಿಸ್ಕತ್ತು', cats['Snacks & Beverages'], 0, 'packet', 25.00, 30.00, 30.00, 48.00, 12.00);
    insertProd.run('8901030588200', 'Red Label Tea 250g', 'ರೆಡ್ ಲೇಬಲ್ ಚಹಾ ಪುಡಿ', cats['Snacks & Beverages'], 0, 'packet', 115.00, 130.00, 135.00, 22.00, 8.00);
    insertProd.run('8901030691230', 'Surf Excel Quick Wash 500g', 'ಸರ್ಫ್ ಎಕ್ಸೆಲ್', cats['Soaps & Detergents'], 0, 'packet', 85.00, 95.00, 100.00, 26.00, 10.00);
    insertProd.run('8901030784560', 'Mysore Sandal Soap 75g', 'ಮೈಸೂರು ಸ್ಯಾಂಡಲ್ ಸೋಪು', cats['Soaps & Detergents'], 0, 'piece', 42.00, 48.00, 48.00, 3.00, 10.00); // Low stock alert!
    insertProd.run('8901030897650', 'Dettol Original Soap 75g', 'ಡೆಟ್ಟಾಲ್ ಸೋಪ್', cats['Soaps & Detergents'], 0, 'piece', 34.00, 40.00, 40.00, 30.00, 10.00);

    // 3. Customers (Local residents of Honnavar with Udhaar accounts)
    const insertCust = database.prepare(`
      INSERT INTO customers (name, phone, address, credit_limit, current_balance)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertCust.run('Ganesh Naik', '+91 94812 34567', 'Prabhat Nagar, Honnavar', 3000.00, 680.00);
    insertCust.run('Suresh Bhat', '+91 98451 98765', 'Car Street, Honnavar', 5000.00, 1420.00);
    insertCust.run('Manjunath Hegde', '+91 97410 54321', 'Kasaragod Road, Honnavar', 2500.00, 0.00);
    insertCust.run('Lakshmi Amma', '+91 99001 11223', 'Fish Market Road, Honnavar', 2000.00, 340.00);

    // 4. Suppliers (Local distributors)
    const insertSupp = database.prepare(`
      INSERT INTO suppliers (name, phone, gstin, address, current_balance)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSupp.run('Kamat Wholesale Distributors', '+91 94481 22334', '29ABCDE1234F1Z5', 'Bunder Road, Kumta', 12500.00);
    insertSupp.run('Canara Dairy Agency (Nandini)', '+91 94482 33445', '29BCDEF2345G2Z6', 'Main Road, Honnavar', 3200.00);

    // Initial Supplier Ledger Entries
    database.prepare(`
      INSERT INTO supplier_ledger (supplier_id, entry_type, amount, balance_after, payment_mode, notes)
      VALUES (?, 'CREDIT', ?, ?, 'OPENING', 'Opening payable balance')
    `).run(1, 12500.00, 12500.00);

    database.prepare(`
      INSERT INTO supplier_ledger (supplier_id, entry_type, amount, balance_after, payment_mode, notes)
      VALUES (?, 'CREDIT', ?, ?, 'OPENING', 'Opening payable balance')
    `).run(2, 3200.00, 3200.00);

    // Sample Purchase Inward from Kamat Wholesale
    database.prepare(`
      INSERT INTO purchases (
        invoice_number, supplier_id, total_items, subtotal, tax_amount,
        grand_total, paid_amount, payment_mode, payment_status, notes, purchase_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PUR-DEMO-001', 1, 2, 8600.00, 0.00, 8600.00, 8600.00,
      'BANK_TRANSFER', 'PAID', 'Delivery of Rice & Sugar bags', '2026-10-24'
    );

    database.prepare(`
      INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit, unit_cost_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 1, 'Sona Masoori Rice (Loose)', 100, 'kg', 48.00, 4800.00);

    database.prepare(`
      INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit, unit_cost_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 2, 'Sugar (Loose)', 100, 'kg', 38.00, 3800.00);

    // 5. Sample Bills (Today & Recent)
    const insertBill = database.prepare(`
      INSERT INTO bills (
        bill_number, customer_id, total_items, subtotal, discount,
        tax_amount, grand_total, payment_mode, cash_received, upi_received,
        credit_added, change_returned, payment_status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = database.prepare(`
      INSERT INTO bill_items (
        bill_id, product_id, product_name, quantity, unit,
        cost_price, unit_price, line_total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Bill 1: Cash sale
    insertBill.run(
      'MGS-DEMO-001', null, 3, 316.00, 6.00, 0.00, 310.00,
      'CASH', 500.00, 0.00, 0.00, 190.00, 'PAID', 'Demo Cash Sale',
      `${todayStr} 08:45:00`
    );
    insertItem.run(1, 1, 'Sona Masoori Rice (Loose)', 2.5, 'kg', 48.00, 56.00, 140.00, `${todayStr} 08:45:00`);
    insertItem.run(1, 6, 'Nandini Toned Milk 500ml', 2, 'packet', 23.50, 25.00, 50.00, `${todayStr} 08:45:00`);
    insertItem.run(1, 10, 'Red Label Tea 250g', 1, 'packet', 115.00, 130.00, 130.00, `${todayStr} 08:45:00`);

    // Bill 2: UPI sale
    insertBill.run(
      'MGS-DEMO-002', null, 2, 231.00, 0.00, 0.00, 231.00,
      'UPI', 0.00, 231.00, 0.00, 0.00, 'PAID', 'Demo UPI PhonePe/GPay Sale',
      `${todayStr} 10:15:00`
    );
    insertItem.run(2, 9, 'Gemini Sunflower Oil 1L Pouch', 1, 'packet', 122.00, 136.00, 136.00, `${todayStr} 10:15:00`);
    insertItem.run(2, 11, 'Surf Excel Quick Wash 500g', 1, 'packet', 85.00, 95.00, 95.00, `${todayStr} 10:15:00`);

    // Bill 3: Udhaar (Credit) sale to Ganesh Naik
    insertBill.run(
      'MGS-DEMO-003', 1, 3, 680.00, 0.00, 0.00, 680.00,
      'CREDIT', 0.00, 0.00, 680.00, 0.00, 'CREDIT', 'Demo Udhaar/Credit to Ganesh Naik',
      `${todayStr} 11:30:00`
    );
    insertItem.run(3, 1, 'Sona Masoori Rice (Loose)', 5, 'kg', 48.00, 56.00, 280.00, `${todayStr} 11:30:00`);
    insertItem.run(3, 2, 'Sugar (Loose)', 2, 'kg', 38.00, 44.00, 88.00, `${todayStr} 11:30:00`);
    insertItem.run(3, 7, 'Nandini Pure Ghee 200ml', 1, 'packet', 128.00, 140.00, 140.00, `${todayStr} 11:30:00`);

    // 6. Customer Ledger entry for Bill 3
    database.prepare(`
      INSERT INTO customer_ledger (
        customer_id, bill_id, entry_type, amount, balance_after, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 3, 'DEBIT', 680.00, 680.00, 'Demo credit purchase: Bill MGS-DEMO-003', `${todayStr} 11:30:00`);

    // 7. Expenses for today
    const insertExp = database.prepare(`
      INSERT INTO expenses (category, description, amount, payment_mode, expense_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertExp.run('Tea & Refreshments', 'Morning and evening tea for shopkeeper & helper', 60.00, 'CASH', todayStr);
    insertExp.run('Packaging & Bags', 'Carry bags and packing paper roll', 150.00, 'UPI', todayStr);

    // 8. Audit log initial entries
    const insertLog = database.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?)
    `);
    insertLog.run('SYSTEM_INIT', 'SYSTEM', '1', 'Initial database migration and realistic demo data seeded successfully');
    insertLog.run('CREATE_BILL', 'BILL', 'MGS-DEMO-001', 'Created demo bill MGS-DEMO-001 (Cash ₹310)');
    insertLog.run('CREATE_BILL', 'BILL', 'MGS-DEMO-002', 'Created demo bill MGS-DEMO-002 (UPI ₹231)');
    insertLog.run('CREATE_BILL', 'BILL', 'MGS-DEMO-003', 'Created demo bill MGS-DEMO-003 (Credit ₹680)');
  });

  console.log('[Seed] Realistic demo data seeded successfully.');
}

// CLI runner check
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    seedDemoData();
  } catch (err) {
    console.error('[Seed] Error seeding demo data:', err);
    process.exit(1);
  }
}
