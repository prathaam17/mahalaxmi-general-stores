-- Mahalaxmi General Stores - Settings & Audit Migration
-- Extends shop settings and adds performance indices on audit logs

ALTER TABLE shop_settings ADD COLUMN receipt_footer TEXT DEFAULT 'ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ • Thank you, visit again!';
ALTER TABLE shop_settings ADD COLUMN gst_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shop_settings ADD COLUMN default_gst_rate REAL NOT NULL DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
