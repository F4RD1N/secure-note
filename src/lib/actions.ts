// This file runs on the server
'use server';

// Import necessary functions and types
import { redirect } from 'next/navigation';
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
    // It deletes notes that are past their expiration time or have no views left
    const stmt = db.prepare(`
      DELETE FROM notes
      WHERE (expires_at IS NOT NULL AND expires_at < ?) OR (views_remaining IS NOT NULL AND views_remaining <= 0)
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
  viewsRemaining: number | null;
}

// This server action creates a new note in the database
export async function createNote(payload: CreateNotePayload) {
  try {
    // Generate a short, unique ID for the note
    const id = nanoid(8);
    const now = Date.now();
    const { content, iv, salt, hasPassword, expiresAt, viewsRemaining } = payload;
    
    // Prepare the SQL statement to insert a new note
    const stmt = db.prepare(`
      INSERT INTO notes (id, content, iv, salt, has_password, expires_at, views_remaining, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Execute the statement with the note data
    stmt.run(id, content, iv, salt, hasPassword ? 1 : 0, expiresAt, viewsRemaining, now);
    
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
    if (note.views_remaining !== null && note.views_remaining <= 0) {
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
        // Get the current number of views remaining for the note
        const note = db.prepare('SELECT views_remaining FROM notes WHERE id = ?').get(id) as Pick<Note, 'views_remaining'> | undefined;

        // If the note exists and has a view limit
        if (note && note.views_remaining !== null) {
            // Decrement the view count by one
            db.prepare('UPDATE notes SET views_remaining = views_remaining - 1 WHERE id = ?').run(id);
        }
    } catch (error) {
        console.error(`Failed to update view count for note ${id}:`, error);
    }
}
