// Import necessary functions and components
import { getNote } from '@/lib/actions';
import { redirect } from 'next/navigation';
import NoteViewer from '@/components/NoteViewer';

// Define the properties for this page component
type Props = {
  params: { noteId: string };
};

// This page component fetches and displays a specific note
export default async function NotePage({ params }: Props) {
  // Fetch the note from the database using its ID
  const note = await getNote(params.noteId);

  // If the note doesn't exist or is expired, redirect to the expired page
  if (!note) {
    redirect('/n/expired');
  }

  // Render the NoteViewer component with the fetched note data
  return <NoteViewer note={note} />;
}
