import { getNote } from '@/lib/actions';
import { redirect } from 'next/navigation';
import NoteViewer from '@/components/NoteViewer';

type Props = {
  params: { noteId: string };
};

export default async function NotePage({ params }: Props) {
  const note = await getNote(params.noteId);

  if (!note) {
    redirect('/n/expired');
  }

  return <NoteViewer note={note} />;
}
