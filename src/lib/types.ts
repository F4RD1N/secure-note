// This file defines the TypeScript types used in the application.

// Defines the structure of a Note object as it is stored in the database.
export type Note = {
  id: string; // Unique identifier for the note
  content: string; // The encrypted content of the note
  iv: string; // The initialization vector used for encryption
  salt: string | null; // The salt used for key derivation (if password protected)
  has_password: 0 | 1; // A flag (0 or 1) to indicate if the note is password protected
  expires_at: number | null; // Timestamp for when the note expires, or null
  delete_after_first_view: 0 | 1; // A flag to indicate if the note should be deleted after one view
  views_count: number; // How many times the note has been viewed
  created_at: number; // Timestamp for when the note was created
};
