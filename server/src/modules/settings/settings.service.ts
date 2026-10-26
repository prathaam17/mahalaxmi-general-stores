import type { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { getDatabase, runInTransaction, checkpointDatabase, closeDatabase } from '../../db/index.js';
import { config } from '../../config/index.js';

export interface ShopSettingsData {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  currencySymbol: string;
  receiptFooter: string;
  gstEnabled: boolean;
  defaultGstRate: number;
  autoPrintReceipt: boolean;
  isDemoMode: boolean;
  updatedAt?: string;
}

export interface DatabaseStatusInfo {
  dbPath: string;
  sizeBytes: number;
  walSizeBytes: number;
  isWalMode: boolean;
  sqliteVersion: string;
  lastModified: string | null;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string;
  createdAt: string;
}

export interface AuditLogFilter {
  search?: string;
  action?: string;
  limit?: number;
}

export class SettingsService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  getSettings(): ShopSettingsData {
    const row = this.db.prepare('SELECT * FROM shop_settings WHERE id = 1').get() as {
      shop_name: string;
      tagline: string | null;
      address: string | null;
      phone: string | null;
      gstin: string | null;
      currency_symbol: string;
      receipt_footer: string | null;
      gst_enabled: number;
      default_gst_rate: number;
      auto_print_receipt: number;
      is_demo_mode: number;
      updated_at: string;
    } | undefined;

    if (!row) {
      return {
        shopName: 'Mahalaxmi General Stores',
        tagline: 'Honnavar, Karnataka',
        address: 'Main Road, Honnavar, Uttara Kannada, Karnataka - 581334',
        phone: '+91 94800 12345',
        gstin: '',
        currencySymbol: '₹',
        receiptFooter: 'ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ • Thank you, visit again!',
        gstEnabled: false,
        defaultGstRate: 0,
        autoPrintReceipt: false,
        isDemoMode: true,
      };
    }

    return {
      shopName: row.shop_name,
      tagline: row.tagline || '',
      address: row.address || '',
      phone: row.phone || '',
      gstin: row.gstin || '',
      currencySymbol: row.currency_symbol || '₹',
      receiptFooter: row.receipt_footer || 'ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ • Thank you, visit again!',
      gstEnabled: Boolean(row.gst_enabled),
      defaultGstRate: Number(row.default_gst_rate) || 0,
      autoPrintReceipt: Boolean(row.auto_print_receipt),
      isDemoMode: Boolean(row.is_demo_mode),
      updatedAt: row.updated_at,
    };
  }

  updateSettings(data: Partial<ShopSettingsData>): ShopSettingsData {
    const current = this.getSettings();

    const shopName = data.shopName?.trim() || current.shopName;
    const tagline = data.tagline !== undefined ? data.tagline.trim() : current.tagline;
    const address = data.address !== undefined ? data.address.trim() : current.address;
    const phone = data.phone !== undefined ? data.phone.trim() : current.phone;
    const gstin = data.gstin !== undefined ? data.gstin.trim().toUpperCase() : current.gstin;
    const currencySymbol = data.currencySymbol?.trim() || current.currencySymbol;
    const receiptFooter = data.receiptFooter !== undefined ? data.receiptFooter.trim() : current.receiptFooter;
    const gstEnabled = data.gstEnabled !== undefined ? (data.gstEnabled ? 1 : 0) : (current.gstEnabled ? 1 : 0);
    const defaultGstRate = data.defaultGstRate !== undefined ? Number(data.defaultGstRate) || 0 : current.defaultGstRate;
    const autoPrintReceipt = data.autoPrintReceipt !== undefined ? (data.autoPrintReceipt ? 1 : 0) : (current.autoPrintReceipt ? 1 : 0);
    const isDemoMode = data.isDemoMode !== undefined ? (data.isDemoMode ? 1 : 0) : (current.isDemoMode ? 1 : 0);

    return runInTransaction(this.db, () => {
      this.db.prepare(`
        UPDATE shop_settings
        SET
          shop_name = ?,
          tagline = ?,
          address = ?,
          phone = ?,
          gstin = ?,
          currency_symbol = ?,
          receipt_footer = ?,
          gst_enabled = ?,
          default_gst_rate = ?,
          auto_print_receipt = ?,
          is_demo_mode = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        shopName,
        tagline,
        address,
        phone,
        gstin,
        currencySymbol,
        receiptFooter,
        gstEnabled,
        defaultGstRate,
        autoPrintReceipt,
        isDemoMode
      );

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('UPDATE_SETTINGS', 'SHOP_SETTINGS', '1', ?)
      `).run(`Updated shop settings for "${shopName}" (Demo: ${isDemoMode === 1 ? 'YES' : 'NO'}, GST: ${gstEnabled === 1 ? 'ON' : 'OFF'})`);

      return this.getSettings();
    });
  }

  getDatabaseStatus(): DatabaseStatusInfo {
    const dbPath = config.DB_PATH;
    let sizeBytes = 0;
    let walSizeBytes = 0;
    let lastModified: string | null = null;

    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      sizeBytes = stat.size;
      lastModified = stat.mtime.toISOString();
    }

    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) {
      const walStat = fs.statSync(walPath);
      walSizeBytes = walStat.size;
    }

    const versionRow = this.db.prepare('SELECT sqlite_version() as ver').get() as { ver: string } | undefined;

    return {
      dbPath: path.resolve(dbPath),
      sizeBytes,
      walSizeBytes,
      isWalMode: true,
      sqliteVersion: versionRow?.ver || '3.x',
      lastModified,
    };
  }

  createBackupFile(): { filePath: string; fileName: string } {
    // Flush active WAL frames into main file
    checkpointDatabase(this.db);

    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const fileName = `mahalaxmi-backup-${ts}.db`;

    return {
      filePath: path.resolve(config.DB_PATH),
      fileName,
    };
  }

  restoreDatabase(buffer: Buffer): { success: boolean; message: string } {
    if (!buffer || buffer.length < 100) {
      throw new Error('Invalid backup file: File is empty or truncated');
    }

    // Verify SQLite header magic string: "SQLite format 3\0"
    const headerMagic = buffer.subarray(0, 16).toString('utf-8');
    if (!headerMagic.startsWith('SQLite format 3')) {
      throw new Error('Invalid backup file: The selected file is not a valid SQLite database file');
    }

    const dbPath = path.resolve(config.DB_PATH);
    const backupSafetyPath = `${dbPath}.pre-restore-${Date.now()}`;

    // 1. Create a safety copy of the current database before overwriting
    if (fs.existsSync(dbPath)) {
      checkpointDatabase(this.db);
      fs.copyFileSync(dbPath, backupSafetyPath);
    }

    // 2. Close active connection and remove old WAL files
    closeDatabase();
    if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
    if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);

    try {
      // 3. Write new database file
      fs.writeFileSync(dbPath, buffer);

      // 4. Re-open and verify integrity
      const newDb = getDatabase();
      const integrity = newDb.prepare('PRAGMA quick_check;').get() as { quick_check?: string } | undefined;
      const result = Object.values(integrity || {})[0];
      if (result !== 'ok') {
        throw new Error(`Restored database failed integrity check: ${result}`);
      }

      // Check required tables exist
      const tables = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
      const tableNames = new Set(tables.map((t) => t.name));
      const required = ['products', 'bills', 'customers', 'shop_settings'];
      for (const req of required) {
        if (!tableNames.has(req)) {
          throw new Error(`Restored database is missing required table: "${req}"`);
        }
      }

      newDb.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('RESTORE_DATABASE', 'SYSTEM', '1', ?)
      `).run(`Database restored successfully from backup upload (${(buffer.length / 1024).toFixed(1)} KB)`);

      this.db = newDb;

      return {
        success: true,
        message: 'Database restored successfully and verified intact',
      };
    } catch (err) {
      // Rollback to safety backup if available
      if (fs.existsSync(backupSafetyPath)) {
        fs.copyFileSync(backupSafetyPath, dbPath);
        this.db = getDatabase();
      }
      throw err;
    }
  }

  getAuditLogs(filters: AuditLogFilter = {}): AuditLogEntry[] {
    const conditions: string[] = ['1 = 1'];
    const params: Array<string | number | null | bigint | Uint8Array> = [];

    if (filters.action && filters.action !== 'all') {
      conditions.push('action = ?');
      params.push(filters.action);
    }

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push('(action LIKE ? OR entity_type LIKE ? OR details LIKE ?)');
      params.push(q, q, q);
    }

    const limit = Math.min(filters.limit || 50, 200);

    const sql = `
      SELECT
        id,
        action,
        entity_type as entityType,
        entity_id as entityId,
        details,
        created_at as createdAt
      FROM audit_logs
      WHERE ${conditions.join(' AND ')}
      ORDER BY id DESC
      LIMIT ?
    `;
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      action: string;
      entityType: string;
      entityId: string | null;
      details: string;
      createdAt: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: r.details,
      createdAt: r.createdAt,
    }));
  }
}
