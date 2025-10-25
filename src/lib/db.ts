import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function initDb() {
  if (db) {
    return db;
  }

  const dbDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'quicknote.db');
  db = new Database(dbPath);

  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      iv TEXT NOT NULL,
      salt TEXT,
      has_password INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      views_remaining INTEGER,
      created_at INTEGER NOT NULL
    );
  `);
  
  console.log('Database initialized.');
  return db;
}
