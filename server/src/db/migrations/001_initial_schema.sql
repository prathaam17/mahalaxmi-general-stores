-- Mahalaxmi General Stores - Initial Schema Migration
-- Designed for offline-first retail POS & shop management

-- Shop settings table
CREATE TABLE IF NOT EXISTS shop_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'Mahalaxmi General Stores',
  tagline TEXT DEFAULT 'Provisions & Daily Essentials',
  address TEXT DEFAULT 'Main Road, Honnavar, Uttara Kannada, Karnataka - 581334',
  phone TEXT DEFAULT '+91 94800 12345',
  gstin TEXT DEFAULT '',
  currency_symbol TEXT DEFAULT '₹',
  is_demo_mode INTEGER NOT NULL DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default shop settings if empty
INSERT OR IGNORE INTO shop_settings (id, shop_name, tagline, address, phone)
VALUES (1, 'Mahalaxmi General Stores', 'Provisions & Daily Essentials', 'Main Road, Honnavar, Uttara Kannada, Karnataka - 581334', '+91 94800 12345');

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products & Loose Goods
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  kannada_name TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_loose INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'packet',
  cost_price REAL NOT NULL DEFAULT 0.00,
  selling_price REAL NOT NULL DEFAULT 0.00,
  mrp REAL NOT NULL DEFAULT 0.00,
  current_stock REAL NOT NULL DEFAULT 0.00,
  min_stock_alert REAL NOT NULL DEFAULT 5.00,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers with Udhaar (credit) support
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  credit_limit REAL NOT NULL DEFAULT 2000.00,
  current_balance REAL NOT NULL DEFAULT 0.00,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  gstin TEXT,
  address TEXT,
  current_balance REAL NOT NULL DEFAULT 0.00,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bills / Sales header
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0.00,
  discount REAL NOT NULL DEFAULT 0.00,
  tax_amount REAL NOT NULL DEFAULT 0.00,
  grand_total REAL NOT NULL DEFAULT 0.00,
  payment_mode TEXT NOT NULL DEFAULT 'CASH',
  cash_received REAL NOT NULL DEFAULT 0.00,
  upi_received REAL NOT NULL DEFAULT 0.00,
  credit_added REAL NOT NULL DEFAULT 0.00,
  change_returned REAL NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'PAID',
  notes TEXT,
  is_reversed INTEGER NOT NULL DEFAULT 0,
  reversed_at DATETIME,
  reversal_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bill line items
CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0.00,
  unit_price REAL NOT NULL,
  line_total REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customer credit (Udhaar) ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL, -- 'DEBIT' (credit purchase), 'CREDIT' (repayment)
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  payment_mode TEXT DEFAULT 'CASH',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shop daily expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'CASH',
  expense_date DATE NOT NULL DEFAULT (DATE('now', 'localtime')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer ON customer_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
