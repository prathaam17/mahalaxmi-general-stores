-- Mahalaxmi General Stores - Cash Drawer & Daily Register Migration
-- Enables opening cash tracking, currency note denomination breakdown, and end-of-day reconciliation

CREATE TABLE IF NOT EXISTS daily_cash_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_date DATE NOT NULL UNIQUE,
  opening_cash REAL NOT NULL DEFAULT 0.00,
  expected_cash REAL NOT NULL DEFAULT 0.00,
  closing_cash REAL,
  difference REAL,
  note_500 INTEGER NOT NULL DEFAULT 0,
  note_200 INTEGER NOT NULL DEFAULT 0,
  note_100 INTEGER NOT NULL DEFAULT 0,
  note_50 INTEGER NOT NULL DEFAULT 0,
  note_20 INTEGER NOT NULL DEFAULT 0,
  note_10 INTEGER NOT NULL DEFAULT 0,
  coins REAL NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
  closing_notes TEXT,
  closed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_register_date ON daily_cash_register(register_date);
