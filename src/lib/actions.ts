'use server';

import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { initDb } from './db';
import type { Note } from './types';

const db = initDb();

// Cleanup routine: delete expired notes
const cleanupNotes = () => {
  try {
    const now = Date.now();
    // Delete notes that are expired by time or have no views left
    const stmt = db.prepare(`
      DELETE FROM notes
      WHERE (expires_at IS NOT NULL AND expires_at < ?) OR (views_remaining IS NOT NULL AND views_remaining <= 0)
    `);
    stmt.run(now);
  } catch (error) {
    console.error('Failed to cleanup notes:', error);
  }
};

interface CreateNotePayload {
  content: string;
  iv: string;
  salt: string | null;
  hasPassword: boolean;
  expiresAt: number | null;
  viewsRemaining: number | null;
}

export async function createNote(payload: CreateNotePayload) {
  try {
    const id = nanoid(8);
    const now = Date.now();
    const { content, iv, salt, hasPassword, expiresAt, viewsRemaining } = payload;
    
    const stmt = db.prepare(`
      INSERT INTO notes (id, content, iv, salt, has_password, expires_at, views_remaining, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, content, iv, salt, hasPassword ? 1 : 0, expiresAt, viewsRemaining, now);
    
    return { id };
  } catch (error) {
    console.error('Failed to create note:', error);
    return { error: 'Could not save the note.' };
  }
}

export async function getNote(id: string): Promise<Note | null> {
  // Run cleanup on each fetch
  cleanupNotes();

  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;

    if (!note) {
      return null;
    }

    // Handle view-based expiration
    if (note.views_remaining !== null) {
      if (note.views_remaining > 0) {
        // Decrement views
        db.prepare('UPDATE notes SET views_remaining = views_remaining - 1 WHERE id = ?').run(id);
        
        // If it was the last view, it will be cleaned up on the next request
        if (note.views_remaining === 1) {
            // we can return the note this time, but next time it will be gone
        }
      } else {
        // This case should be handled by cleanup, but as a fallback:
        return null;
      }
    }

    // Handle time-based expiration
    if (note.expires_at !== null && note.expires_at < Date.now()) {
      return null;
    }
    
    return note;
  } catch (error) {
    console.error(`Failed to get note ${id}:`, error);
    return null;
  }
}
