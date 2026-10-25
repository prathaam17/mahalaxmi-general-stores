import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';

let dbInstance: DatabaseSync | null = null;

/**
 * Initializes and returns the SQLite database connection.
 * Sets WAL mode, enables foreign keys, and ensures directory existence.
 */
export function getDatabase(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || config.DB_PATH;

  // For in-memory databases (e.g. in tests)
  if (dbPath === ':memory:') {
    const memoryDb = new DatabaseSync(':memory:');
    memoryDb.exec('PRAGMA foreign_keys = ON;');
    return memoryDb;
  }

  // Ensure data folder exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  // Recommended SQLite PRAGMAs for fast, durable offline retail transactions
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA temp_store = MEMORY;');

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

/**
 * Execute an operation within an immediate transaction.
 * Automatically commits on success, and rolls back cleanly on failure.
 */
export function runInTransaction<T>(db: DatabaseSync, action: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = action();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
