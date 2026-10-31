-- Migration 006: Bilingual Kannada & English Search Keywords
-- Adds search_keywords column to products for phonetic English-Kannada lookups
ALTER TABLE products ADD COLUMN search_keywords TEXT;
CREATE INDEX IF NOT EXISTS idx_products_search_keywords ON products(search_keywords);
