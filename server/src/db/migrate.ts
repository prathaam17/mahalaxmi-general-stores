import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(db?: DatabaseSync): { applied: string[]; skipped: string[] } {
  const database = db || getDatabase();

  // Create _migrations tracking table if it doesn't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const appliedRows = database.prepare('SELECT name, checksum FROM _migrations').all() as Array<{
    name: string;
    checksum: string;
  }>;
  const appliedMap = new Map(appliedRows.map((r) => [r.name, r.checksum]));

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');

    if (appliedMap.has(file)) {
      skipped.push(file);
      continue;
    }

    console.log(`[Migrations] Applying: ${file}...`);

    runInTransaction(database, () => {
      database.exec(sql);
      const insertStmt = database.prepare(
        'INSERT INTO _migrations (name, checksum) VALUES (?, ?)'
      );
      insertStmt.run(file, checksum);
    });

    applied.push(file);
    console.log(`[Migrations] Successfully applied: ${file}`);
  }

  return { applied, skipped };
}

// CLI runner check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log('[Migrations] Checking and running pending database migrations...');
    const result = runMigrations();
    console.log(`[Migrations] Finished. Applied: ${result.applied.length}, Already up-to-date: ${result.skipped.length}`);
  } catch (err) {
    console.error('[Migrations] Failed to run migrations:', err);
    process.exit(1);
  }
}
