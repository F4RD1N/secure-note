'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createNote } from '@/lib/actions';
import { encrypt } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Copy, Settings, Loader2, Link as LinkIcon, Share2 } from 'lucide-react';
import { nanoid } from 'nanoid';

const formSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty.'),
  password: z.string().optional(),
  expireValue: z.coerce.number().min(1).optional(),
  expireUnit: z.enum(['minutes', 'hours', 'days']).optional(),
  views: z.coerce.number().min(1).optional(),
  deleteAfterFirstView: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NoteCreator() {
  const [showSettings, setShowSettings] = useState(false);
  const [noteLink, setNoteLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      password: '',
      expireUnit: 'hours',
      deleteAfterFirstView: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const hasPassword = !!data.password;
      let key = '';
      let salt = null;

      if (hasPassword) {
        key = data.password as string;
      } else {
        key = nanoid(32);
      }

      const { ciphertext, iv, salt: returnedSalt } = encrypt(data.content, key);
      salt = returnedSalt;

      let expiresAt: number | null = null;
      if (data.expireValue && data.expireUnit) {
        const now = new Date();
        const multiplier = {
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000,
        };
        expiresAt = now.getTime() + data.expireValue * multiplier[data.expireUnit];
      }

      let viewsRemaining = data.views ? data.views : null;
      if (data.deleteAfterFirstView) {
        viewsRemaining = 1;
      }

      const result = await createNote({
        content: ciphertext,
        iv,
        salt,
        hasPassword,
        expiresAt,
        viewsRemaining,
      });

      if (result.id) {
        const link = `${window.location.origin}/n/${result.id}${!hasPassword ? `#${key}` : ''}`;
        setNoteLink(link);
      } else {
        throw new Error('Failed to create note.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create the note. Please try again.',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (noteLink) {
      navigator.clipboard.writeText(noteLink);
      toast({
        title: 'Copied!',
        description: 'The note link has been copied to your clipboard.',
      });
    }
  };
  
  const shareLink = () => {
    if (navigator.share && noteLink) {
      navigator.share({
        title: 'QuickNote Link',
        text: 'Here is a secure note for you:',
        url: noteLink,
      }).catch(error => console.log('Error sharing:', error));
    } else {
      copyToClipboard();
    }
  };


  if (noteLink) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-primary" />
              Link Created!
            </CardTitle>
            <CardDescription>Your secure note is ready to be shared.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <QRCode value={noteLink} size={160} bgColor="hsl(var(--background))" fgColor="hsl(var(--foreground))" className="p-2 bg-card rounded-lg border"/>
            </div>
            <div className="flex items-center space-x-2">
              <Input value={noteLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={shareLink} className="w-full">
                    <Share2 className="mr-2 h-4 w-4" /> Share Link
                </Button>
                <Button variant="secondary" onClick={() => { setNoteLink(null); form.reset(); }} className="w-full">
                  Create Another Note
                </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Type your secret note here..."
                    className="h-64 resize-none text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 shadow-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password (optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Protect your note" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expireValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires after</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 2" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expireUnit"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel className="opacity-0 hidden md:inline-block">Unit</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unit"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                          </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="deleteAfterFirstView"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Self-destruct</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Delete note after the first view.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky bottom-0 bg-background py-4 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : 'Create Link'
            }
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full sm:w-auto"
            aria-label="Toggle settings"
          >
            <Settings className="h-4 w-4" />
            <span className="sm:hidden ml-2">Settings</span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
