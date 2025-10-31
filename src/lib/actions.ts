// This file runs on the server
'use server';

// Import necessary functions and types
import { nanoid } from 'nanoid';
import { initDb } from './db';
import type { Note } from './types';

// Initialize the database connection
const db = initDb();

// This function cleans up old notes from the database
const cleanupNotes = () => {
  try {
    const now = Date.now();
    // Prepare a SQL statement to delete notes
    // It deletes notes that are past their expiration time or have been viewed if set to self-destruct
    const stmt = db.prepare(`
      DELETE FROM notes
      WHERE (expires_at IS NOT NULL AND expires_at < ?) OR (delete_after_first_view = 1 AND views_count > 0)
    `);
    // Execute the statement with the current time
    stmt.run(now);
  } catch (error) {
    console.error('Failed to cleanup notes:', error);
  }
};

// Define the structure for the data needed to create a note
interface CreateNotePayload {
  content: string;
  iv: string;
  salt: string | null;
  hasPassword: boolean;
  expiresAt: number | null;
  deleteAfterFirstView: boolean;
}

// This server action creates a new note in the database
export async function createNote(payload: CreateNotePayload) {
  try {
    // Generate a short, unique ID for the note
    const id = nanoid(8);
    const now = Date.now();
    const { content, iv, salt, hasPassword, expiresAt, deleteAfterFirstView } = payload;
    
    // Prepare the SQL statement to insert a new note
    const stmt = db.prepare(`
      INSERT INTO notes (id, content, iv, salt, has_password, expires_at, delete_after_first_view, created_at, views_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    // Execute the statement with the note data
    stmt.run(id, content, iv, salt, hasPassword ? 1 : 0, expiresAt, deleteAfterFirstView ? 1 : 0, now);
    
    // Return the new note's ID
    return { id };
  } catch (error) {
    console.error('Failed to create note:', error);
    // Return an error message if something goes wrong
    return { error: 'Could not save the note.' };
  }
}

// This server action retrieves a note from the database
export async function getNote(id: string): Promise<Note | null> {
  // Run the cleanup function every time a note is fetched
  cleanupNotes();

  try {
    // Prepare and run a query to get the note by its ID
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;

    // If no note is found, return null
    if (!note) {
      return null;
    }

    // Check for time-based expiration
    if (note.expires_at !== null && note.expires_at < Date.now()) {
      return null;
    }
    
    // Check for view-based expiration
    if (note.delete_after_first_view && note.views_count > 0) {
        return null;
    }
    
    // If the note is valid, return it
    return note;
  } catch (error) {
    console.error(`Failed to get note ${id}:`, error);
    return null;
  }
}

// This server action confirms that a note has been viewed
export async function confirmNoteView(id: string) {
    try {
        // Increment the view count by one
        db.prepare('UPDATE notes SET views_count = views_count + 1 WHERE id = ?').run(id);
    } catch (error) {
        console.error(`Failed to update view count for note ${id}:`, error);
    }
}
