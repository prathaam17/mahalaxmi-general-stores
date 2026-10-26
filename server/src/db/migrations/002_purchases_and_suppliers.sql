-- Mahalaxmi General Stores - Purchases & Supplier Ledger Migration
-- Enables stock inward receiving and supplier payable tracking

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  total_items INTEGER NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0.00,
  tax_amount REAL NOT NULL DEFAULT 0.00,
  grand_total REAL NOT NULL DEFAULT 0.00,
  paid_amount REAL NOT NULL DEFAULT 0.00,
  payment_mode TEXT NOT NULL DEFAULT 'CASH', -- 'CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT'
  payment_status TEXT NOT NULL DEFAULT 'PAID', -- 'PAID', 'PARTIAL', 'UNPAID'
  notes TEXT,
  purchase_date DATE NOT NULL DEFAULT (DATE('now', 'localtime')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  unit_cost_price REAL NOT NULL,
  line_total REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL, -- 'CREDIT' (goods received, increases payable balance), 'DEBIT' (payment made, decreases payable balance)
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  payment_mode TEXT DEFAULT 'CASH',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_supplier ON supplier_ledger(supplier_id);
