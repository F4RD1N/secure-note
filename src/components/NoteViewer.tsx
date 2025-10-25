'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { decrypt } from '@/lib/crypto';
import type { Note } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, Lock, Hourglass, Loader2 } from 'lucide-react';

interface NoteViewerProps {
  note: Note;
}

const passwordSchema = z.object({
  password: z.string().min(1, 'رمز عبور الزامی است.'),
});

export default function NoteViewer({ note }: NoteViewerProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (note.expires_at) {
      const updateTimer = () => {
        const remaining = note.expires_at! - Date.now();
        if (remaining > 0) {
          setTimeLeft(formatDistanceToNow(note.expires_at!, { locale: faIR, addSuffix: true }));
        } else {
          setTimeLeft('منقضی شده');
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [note.expires_at]);

  useEffect(() => {
    if (!note.has_password) {
      try {
        const key = window.location.hash.substring(1);
        if (!key) {
          setError('کلید رمزگشایی در آدرس یافت نشد.');
          return;
        }
        const content = decrypt({ content: note.content, iv: note.iv, salt: note.salt }, key);
        setDecryptedContent(content);
      } catch (e) {
        setError('رمزگشایی یادداشت ناموفق بود. ممکن است لینک خراب باشد.');
        console.error(e);
      }
    }
  }, [note]);

  const handlePasswordSubmit = async (data: { password: string }) => {
    setIsDecrypting(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    try {
      const content = decrypt({ content: note.content, iv: note.iv, salt: note.salt }, data.password);
      setDecryptedContent(content);
    } catch (e) {
      setError('رمز عبور نامعتبر است. لطفاً دوباره تلاش کنید.');
      console.error(e);
      form.reset();
    } finally {
      setIsDecrypting(false);
    }
  };

  if (decryptedContent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>یادداشت امن شما</CardTitle>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-2">
              {note.views_remaining !== null && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {note.views_remaining} بازدید باقی مانده
                </span>
              )}
              {timeLeft !== null && (
                <span className="flex items-center gap-1.5">
                  <Hourglass className="w-4 h-4" /> {timeLeft}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-body text-base bg-muted/50 p-4 rounded-md">
              {decryptedContent}
            </pre>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (note.has_password) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> محافظت شده با رمز عبور
            </CardTitle>
            <CardDescription>برای مشاهده این یادداشت، رمز عبور را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز عبور</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isDecrypting}>
                  {isDecrypting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  رمزگشایی یادداشت
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 w-full h-full">
       {error ? (
         <Alert variant="destructive" className="w-full">
            <AlertTitle>خطای رمزگشایی</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
       ) : (
         <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">در حال رمزگشایی یادداشت...</p>
         </>
       )}
    </div>
  );
}
