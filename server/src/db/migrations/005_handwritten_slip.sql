-- Migration 005: Handwritten bills & slips support
-- Adds slip_number to bills for cross-referencing paper bill books
-- Adds auto_print_receipt setting (defaults to 0 / false for handwritten billing)

ALTER TABLE bills ADD COLUMN slip_number TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_slip_number ON bills(slip_number);

ALTER TABLE shop_settings ADD COLUMN auto_print_receipt INTEGER NOT NULL DEFAULT 0;
