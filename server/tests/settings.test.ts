import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { SettingsService } from '../src/modules/settings/settings.service.js';

describe('Settings, Backup and Audit Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: SettingsService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new SettingsService(db);
  });

  it('retrieves default store settings', () => {
    const settings = service.getSettings();

    expect(settings.shopName).toBe('Mahalaxmi General Stores');
    expect(settings.currencySymbol).toBe('₹');
    expect(settings.receiptFooter).toBeDefined();
    expect(settings.address).toContain('Honnavar');
  });

  it('updates store settings, updates GST status, and records in audit log', () => {
    const updated = service.updateSettings({
      shopName: 'Mahalaxmi Kirana & General Stores',
      tagline: 'Wholesale & Retail Groceries, Honnavar',
      gstin: '29ABCDE1234F1Z5',
      gstEnabled: true,
      defaultGstRate: 5.0,
      isDemoMode: false,
    });

    expect(updated.shopName).toBe('Mahalaxmi Kirana & General Stores');
    expect(updated.gstin).toBe('29ABCDE1234F1Z5');
    expect(updated.gstEnabled).toBe(true);
    expect(updated.defaultGstRate).toBe(5.0);
    expect(updated.isDemoMode).toBe(false);

    // Verify audit log
    const audit = db.prepare("SELECT * FROM audit_logs WHERE action = 'UPDATE_SETTINGS' ORDER BY id DESC LIMIT 1").get() as {
      details: string;
    };
    expect(audit.details).toContain('Mahalaxmi Kirana & General Stores');
  });

  it('retrieves database status information', () => {
    const status = service.getDatabaseStatus();

    expect(status.dbPath).toBeDefined();
    expect(status.sqliteVersion).toBeDefined();
    expect(status.isWalMode).toBe(true);
  });

  it('retrieves audit logs with search and action filters', () => {
    const logs = service.getAuditLogs({ limit: 10 });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBeDefined();
    expect(logs[0].details).toBeDefined();
    expect(logs[0].createdAt).toBeDefined();

    const filtered = service.getAuditLogs({ action: 'CREATE_BILL' });
    expect(filtered.every((l) => l.action === 'CREATE_BILL')).toBe(true);
  });

  it('rejects restoring an invalid non-SQLite file', () => {
    // 1. Empty or truncated file
    const shortBuffer = Buffer.from('too short');
    expect(() => {
      service.restoreDatabase(shortBuffer);
    }).toThrow('File is empty or truncated');

    // 2. Large non-SQLite file
    const fakeBuffer = Buffer.alloc(200, 'X');
    expect(() => {
      service.restoreDatabase(fakeBuffer);
    }).toThrow('not a valid SQLite database file');
  });
});
