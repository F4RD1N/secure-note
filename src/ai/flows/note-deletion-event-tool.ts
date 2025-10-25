'use server';
/**
 * @fileOverview A tool that allows deletion events to be triggered in the application when the note has settings applied to it such as expiration date or views.
 *
 * - noteDeletionEventTool - A function that allows deletion events to be triggered.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NoteDeletionEventInputSchema = z.object({
  noteId: z.string().describe('The ID of the note to be deleted.'),
});
export type NoteDeletionEventInput = z.infer<typeof NoteDeletionEventInputSchema>;

const NoteDeletionEventOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the deletion event was successfully triggered.'),
  message: z.string().describe('A message providing details about the deletion event outcome.'),
});
export type NoteDeletionEventOutput = z.infer<typeof NoteDeletionEventOutputSchema>;

export async function noteDeletionEventTool(input: NoteDeletionEventInput): Promise<NoteDeletionEventOutput> {
  return noteDeletionEventFlow(input);
}

const noteDeletionEventFlow = ai.defineFlow(
  {
    name: 'noteDeletionEventFlow',
    inputSchema: NoteDeletionEventInputSchema,
    outputSchema: NoteDeletionEventOutputSchema,
  },
  async input => {
    // Simulate a successful deletion event for demonstration purposes.
    // In a real application, this would involve interacting with the database
    // or other storage mechanisms to delete the note.
    console.log(`Simulating deletion event for note ID: ${input.noteId}`);
    return {
      success: true,
      message: `Deletion event triggered for note ID: ${input.noteId}`,
    };
  }
);
