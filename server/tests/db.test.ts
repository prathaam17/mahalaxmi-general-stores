import { describe, it, expect } from 'vitest';
import { getDatabase, runInTransaction } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Database and Migration System', () => {
  it('creates an in-memory database and executes migrations cleanly', () => {
    const db = getDatabase(':memory:');
    const result = runMigrations(db);

    expect(result.applied).toContain('001_initial_schema.sql');

    // Verify shop_settings table was populated
    const settings = db.prepare('SELECT * FROM shop_settings WHERE id = 1').get() as {
      shop_name: string;
    };
    expect(settings).toBeDefined();
    expect(settings.shop_name).toBe('Mahalaxmi General Stores');
  });

  it('handles transactions and rolls back on failure', () => {
    const db = getDatabase(':memory:');
    runMigrations(db);

    // Initial count
    const initialCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;

    // Transaction that throws error
    expect(() => {
      runInTransaction(db, () => {
        db.prepare("INSERT INTO categories (name, description) VALUES ('Temp Category', 'Test')").run();
        throw new Error('Simulated atomic transaction failure');
      });
    }).toThrow('Simulated atomic transaction failure');

    // Count should be unchanged due to atomic rollback
    const afterCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
    expect(afterCount).toBe(initialCount);
  });
});
