// Import the database library and Node.js modules
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// This will hold the database instance
let db: Database.Database;

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
      views_remaining INTEGER,
      created_at INTEGER NOT NULL
    );
  `);
  
  // Log that the database has been initialized
  console.log('Database initialized.');
  // Return the database instance
  return db;
}
