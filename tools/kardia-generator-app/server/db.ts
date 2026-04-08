import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// kardia.db lives at the app root (tools/kardia-generator-app/)
const DB_PATH = path.join(__dirname, '..', 'kardia.db');

// Canonical schema is at the repo root: data/schema/kardia_schema.sql
// server/ → kardia-generator-app/ → tools/ → repo root
const SCHEMA_PATH = path.join(__dirname, '..', '..', '..', 'data', 'schema', 'kardia_schema.sql');

const db = new Database(DB_PATH);

// Idempotency guard: only run schema if _schema_meta doesn't exist yet.
// The schema uses bare CREATE TABLE (no IF NOT EXISTS) and CREATE VIRTUAL TABLE
// (FTS5) which doesn't support IF NOT EXISTS — so we run it exactly once.
const isInit = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_schema_meta'")
  .get();

if (!isInit) {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(sql);
  console.log('[db] Schema installed from kardia_schema.sql');
} else {
  console.log('[db] Schema already installed — skipping');
}

export default db;
