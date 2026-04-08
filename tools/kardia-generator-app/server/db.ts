import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'kardia.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Install schema on first boot
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id               TEXT PRIMARY KEY,
    data             TEXT NOT NULL,
    category_label   TEXT,
    transliteration  TEXT,
    hebrew_root      TEXT,
    iterations       INTEGER DEFAULT 1,
    approved_at      TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
