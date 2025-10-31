// Import the database library and Node.js modules
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// This will hold the database instance
let db: Database.Database;

// This function checks if a column exists in a table
function columnExists(tableName: string, columnName: string): boolean {
  try {
    const result = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
    return result.some(col => col.name === columnName);
  } catch (e) {
    return false;
  }
}

// Function to initialize the database
export function initDb() {
  // If the database is already initialized, return the existing instance
  if (db) {
    return db;
  }

  // Define the directory where the database file will be stored
  const dbDir = path.join(process.cwd(), '.data');
  // If the directory doesn't exist, create it
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Define the path to the database file
  const dbPath = path.join(dbDir, 'quicknote.db');
  // Create a new database instance
  db = new Database(dbPath);

  // Execute a SQL command to create the 'notes' table if it doesn't already exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      iv TEXT NOT NULL,
      salt TEXT,
      has_password INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  // Migration: Add delete_after_first_view column if it doesn't exist
  if (!columnExists('notes', 'delete_after_first_view')) {
    console.log("Migrating database: Adding 'delete_after_first_view' column...");
    db.exec('ALTER TABLE notes ADD COLUMN delete_after_first_view INTEGER NOT NULL DEFAULT 0');
  }

  // Migration: Add views_count column if it doesn't exist
  if (!columnExists('notes', 'views_count')) {
    console.log("Migrating database: Adding 'views_count' column...");
    db.exec('ALTER TABLE notes ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0');
  }

  // Migration: Remove views_remaining column if it exists
  if (columnExists('notes', 'views_remaining')) {
    console.log("Migrating database: Removing 'views_remaining' column...");
    // better-sqlite3 doesn't support dropping columns directly in a simple way.
    // The standard way is to create a new table and copy data.
    db.transaction(() => {
      db.exec(`
        CREATE TABLE notes_new (
          id TEXT PRIMARY KEY NOT NULL,
          content TEXT NOT NULL,
          iv TEXT NOT NULL,
          salt TEXT,
          has_password INTEGER NOT NULL DEFAULT 0,
          expires_at INTEGER,
          created_at INTEGER NOT NULL,
          delete_after_first_view INTEGER NOT NULL DEFAULT 0,
          views_count INTEGER NOT NULL DEFAULT 0
        );
      `);
      db.exec(`
        INSERT INTO notes_new (id, content, iv, salt, has_password, expires_at, created_at, delete_after_first_view, views_count)
        SELECT id, content, iv, salt, has_password, expires_at, created_at, 
               CASE WHEN views_remaining = 1 THEN 1 ELSE 0 END, 
               0
        FROM notes;
      `);
      db.exec('DROP TABLE notes');
      db.exec('ALTER TABLE notes_new RENAME TO notes');
    })();
    console.log("Database migration complete.");
  }
  
  // Log that the database has been initialized
  console.log('Database initialized.');
  // Return the database instance
  return db;
}
